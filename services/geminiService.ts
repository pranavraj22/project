import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExamData, UploadedFile, SkillRoadmap } from "../types";
import { searchWebResources, fetchLatestResources, SearchResult } from "./webScraperService";
import { sanitizeInput, validateFile } from "../utils/security";

const apiKey = process.env.GEMINI_API_KEY || process.env.Api_name;
const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

// Simple memory cache for diagram images
const diagramCache = new Map<string, string>();

const qSchema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    answer: { type: Type.STRING },
    diagramPrompt: {
      type: Type.STRING,
      description: "A descriptive prompt to generate a flowchart, diagram, or visual table if it significantly aids the answer. Leave empty if not needed."
    },
  },
  required: ["question", "answer"],
};

const examSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topicName: { type: Type.STRING },
    veryShortQuestions: {
      type: Type.ARRAY,
      items: qSchema,
    },
    shortQuestions: {
      type: Type.ARRAY,
      items: qSchema,
    },
    longQuestions: {
      type: Type.ARRAY,
      items: qSchema,
    },
    numericals: {
      type: Type.ARRAY,
      items: qSchema,
    },
    examinerNotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    youtubeQueries: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["topicName", "veryShortQuestions", "shortQuestions", "longQuestions", "examinerNotes", "youtubeQueries"],
};

export const generateExamContent = async (
  lectureFiles: UploadedFile[],
  syllabusFiles: UploadedFile[],
  details: { college: string; subject: string; semester: string; examType: string; units?: string }
): Promise<ExamData> => {
  // Security Validation
  const validLectureFiles = lectureFiles.filter(f => validateFile(f));
  const validSyllabusFiles = syllabusFiles.filter(f => validateFile(f));

  if (validLectureFiles.length !== lectureFiles.length || validSyllabusFiles.length !== syllabusFiles.length) {
    console.warn("Some files were rejected during security validation.");
  }

  // Sanitization
  const safeDetails = {
    college: sanitizeInput(details.college),
    subject: sanitizeInput(details.subject),
    semester: sanitizeInput(details.semester),
    examType: sanitizeInput(details.examType),
    units: details.units ? sanitizeInput(details.units) : undefined
  };

  const model = "gemini-2.5-flash";

  let specificInstructions = "";

  if (safeDetails.examType === 'Semester Examination') {
    specificInstructions = `
      BEHAVIOR: SEMESTER EXAMINATION
      - Follow university exam patterns strictly.
      - ${safeDetails.units ? `**SCOPE RESTRICTION**: Generate questions ONLY from: ${safeDetails.units}.` : 'Cover the FULL SYLLABUS evenly.'}
      - **Content Focus**: Prioritize Definitions, Detailed Explanations, Diagrams (if applicable), and Examples.
      - Categorize questions into Very Short (2 marks), Short Answer (5 marks), and Long Answer (10+ marks).
      - Emphasize marking schemes, answer structure, and keywords.
    `;
  } else if (safeDetails.examType === 'Mid Examination') {
    specificInstructions = `
      BEHAVIOR: MID EXAMINATION
      - **CRITICAL**: The user has specified the syllabus coverage as: "${safeDetails.units}". 
      - **YOU MUST ONLY** generate questions from these specific Units/Chapters.
      - Do NOT cover topics outside these units.
      - **Content Focus**: Provide definitions, explanations, and diagrams relevant to the specific units.
      - Keep answers exam ready presentation.
      - Focus on Short and Long answers mostly.
    `;
  } else if (safeDetails.examType === 'Competitive Examination') {
    specificInstructions = `
      BEHAVIOR: COMPETITIVE EXAMINATION
      - ${safeDetails.units ? `**SCOPE RESTRICTION**: Focus purely on: ${safeDetails.units}.` : ''}
      - Focus primarily on NUMERICALS and PROBLEM-SOLVING.
      - **Content Focus**: Step-by-step logic, formulas, substitution, and final answer.
      - **NO UNNECESSARY THEORY** for numericals.
      - Increase difficulty and variation (Application-based).
      - Frame questions in objective or application-based formats.
      - CRITICAL: Fill the 'numericals' array heavily. 
      - Use 'shortQuestions' for conceptual trick questions.
      - Leave 'longQuestions' empty or strictly use for complex multi-step problems.
    `;
  }

  const prompt = `
    ### Persona
    You are a senior university examiner and paper setter for ${safeDetails.college}, Subject: ${safeDetails.subject}.
    
    ### Task
    Analyze the attached files:
    1. **Syllabus Files (if provided):** Use these to determine the SCOPE and WEIGHTAGE of topics.
    2. **Lecture Notes:** Use these for the SPECIFIC content, definitions, and depth covered in class.
    3. Generate all exam-oriented important questions based on the EXAM TYPE: ${safeDetails.examType}.
    4.Generate answers using a STRUCTURE that adapts automatically based on the subject.
     Answers must be exam ready presentation, complete, technically accurate, and formatted for maximum exam scoring.
    ${specificInstructions}
    5.IF Subject == "Computer Science / Engineering" Generate exam-oriented questions for programming subjects with a mandatory mix of THEORY and PROGRAMMING (CODING) questions.
      MANDATORY QUESTION DISTRIBUTION (CRITICAL):
    - At least 60% PROGRAMMING (coding) questions
    - At most 40% THEORY questions
    - Do NOT output theory-only sets
    6.Generate only IMPORTANT and FREQUENTLY ASKED programming questions for exam preparation.

QUESTION SELECTION CRITERIA (CRITICAL):
Include problems from ALL of the following categories:

1. Number-based programs:
   - Palindrome number
   - Armstrong / Strong number
   - Prime number
   - Perfect number
   - Factorial
   - Sum of digits
   - Reverse number

2. Series and patterns:
   - Fibonacci series
   - Number patterns
   - Star patterns

3. Arrays:
   - Find largest / smallest element
   - Sorting (basic)
   - Searching (linear / binary)
   - Array rotation
   - Remove duplicates

4. Strings:
   - Palindrome string
   - String reversal
   - Character frequency
   - Vowel and consonant count

5. Functions and recursion:
   - Recursive factorial
   - Recursive Fibonacci
   - Menu-driven programs

6. Control structures:
   - Loop-based problems
   - Conditional logic programs

EXAM-AWARE FILTERING:
  - Mid exam → Basic logic, short programs
  - Semester exam → Complete programs with input/output
  - Competitive exam → Logic-intensive and optimized problems




    ### STRICT OUTPUT RULES (MANDATORY FOR "answer" FIELD)

    0) PDF-SAFE FORMATTING (CRITICAL FOR EXPORT)
    - **LINE LENGTH**: Keep each line under 80 characters to fit A4 margins.
    - **SHORT PARAGRAPHS**: Maximum 3-4 sentences per paragraph.
    - **NARROW TABLES**: Tables must have maximum 3 columns with short cell content.
    - **NO WIDE CONTENT**: Avoid long equations or formulas on single lines.
    - **NATURAL BREAKS**: Use line breaks after each concept or step.
    - **VERTICAL SPACING**: Add blank lines between sections for clarity.
    - **PLAIN TEXT ONLY**: Output must be compatible with Word/Google Docs.
    - **NO SPECIAL CHARACTERS**: Avoid Unicode symbols that may not render.

    1) READABILITY FIRST
    - **DO NOT** use $$, LaTeX blocks, or special math environments.
    - Use plain-text symbols only ( =, +, -, *, /, ^ ).
    - Write equations on separate lines (keep under 60 characters).
    - Break long equations into multiple lines if needed.
    - Keep spacing clean and consistent.

    2) ADAPTIVE SOLUTION FLOW
    Automatically choose the correct flow based on the question type:


SUBJECT-SPECIFIC STRUCTURE RULES:

IF Subject == "Chemistry":
Use EXACTLY the following structure (do not skip sections if applicable):

Question:
{{question_text}}

1. Definition / Concept Explanation
- Clear and precise definition
- Use standard chemistry terminology
- No storytelling

2. Reaction / Mechanism / Process Flow
- Present as step-wise flow
- Use arrows written in plain text
- If reaction-based, include balanced equations in text form

3. Flowchart (if applicable)
- Represent flowchart using numbered steps or arrows
- Do NOT use images or LaTeX
Example:
Step 1 → Step 2 → Step 3

4. Diagram Description (Mandatory if diagram is normally expected)
- Clearly describe what should be drawn
- Include labels that must be shown in the diagram
Example:
"Diagram shows benzene ring with substituents at para position..."

5. Explanation of Each Step / Reaction
- Explain purpose and outcome of each step
- Mention conditions, catalysts, temperature if relevant

6. Advantages and Disadvantages (ONLY if conceptually relevant)
Advantages:
- Point 1
- Point 2

Disadvantages:
- Point 1
- Point 2

7. Applications / Examples (if exam-relevant)
- exam ready presentation and presentation ready

---

IF Subject == "Mathematics":
Structure as:
1. Given Data
2. Required
3. Formula Used
4. Step-by-step Solution
5. Final Answer (boxed in text)

---

IF Subject == "Physics":
Structure as:
1. Principle / Law
2. Formula
3. Derivation or Explanation
4. Diagram Description
5. Numerical Example (if applicable)
6. Conclusion

---

IF Subject == "Computer Science / Engineering":

Structure as:
Only applicable points are to be used
1. Definition
2. Algorithm / Logic
3. Pseudocode or Steps
4. Explanation
5. Advantages / Limitations
6. Applications
7.code(step by step code to solve the problem)

---

GLOBAL RULES (NON-NEGOTIABLE):

- Maintain the SAME heading format for every answer.
- Cover ALL major subtopics related to the question.
- Avoid unnecessary length.
- No LaTeX, no $$, no Unicode symbols.
- Plain text only.
- Exam-ready language.
- If a diagram is expected, ALWAYS include a diagram description.
- Never mix structures across subjects.

OUTPUT:
Only the final formatted exam ready presentation answer.
No explanations.
No meta text.

    4) FINAL ANSWER EMPHASIS
    - Always end with:
      Final Answer: ...
    - The final answer must be clearly visible.

    5) EXAM DISCIPLINE
    - Match answer length to expected marks.
    - No extra theory.
    - No casual language.
    - No motivational or conversational text.
    
    6) NO HALLUCINATIONS
    - Never invent facts or data. Use the provided lecture notes and syllabus as ground truth.
    - If a specific topic is not in the input, do not invent questions for it unless it is standard knowledge for the subject.

    STRICT INSTRUCTIONS:
  - Generate MORE questions than usual.
  - Do NOT repeat the same concept with minor rewording.
  - Cover relevant topics proportionally (within the specified Units/Chapters).
  - Prefer exam-relevant framing over textbook-style questions.
  - Avoid vague or generic questions.

  QUANTITY REQUIREMENTS (MANDATORY):
 
  - Very Short Questions: minimum 25–30 (if applicable)
  - Short Answer Questions: minimum 20–25 (Adjust questions based on exam type as per college exam pattern)
  - Long Answer Questions: minimum 15–20 (Adjust questions based on exam type as per college exam pattern)
  - Numerical / Problem-Solving: minimum 50–55 (Critical for Competitive Exams)

    For each question, provide a high-scoring, keyword-rich answer following the structure rule.
    Include examiner notes on marks-saving tips.

    ### Context
    - Subject: ${safeDetails.subject}
    - Semester: ${safeDetails.semester}
    - Exam Type: ${safeDetails.examType}
    - Units/Modules Covered: ${safeDetails.units || 'Full Syllabus'}

    Generate the response in JSON format matching the schema provided.
  `;

  try {
    const lectureParts = validLectureFiles.map(file => ({
      inlineData: { data: file.base64, mimeType: file.mimeType },
    }));

    const syllabusParts = validSyllabusFiles.map(file => ({
      inlineData: { data: file.base64, mimeType: file.mimeType },
    }));

    const response = await genAI.models.generateContent({
      model,
      contents: {
        parts: [
          ...syllabusParts,
          ...lectureParts,
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: examSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as ExamData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateDiagramImage = async (prompt: string, checkCacheOnly: boolean = false): Promise<string | null> => {
  if (diagramCache.has(prompt)) {
    return diagramCache.get(prompt) || null;
  }

  if (checkCacheOnly) {
    return null;
  }

  const model = "gemini-2.5-flash-image";
  try {
    const response = await genAI.models.generateContent({
      model,
      contents: {
        parts: [{ text: `Generate a clear educational diagram: ${prompt}. Legible labels, white background.` }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Data = `data:image/png;base64,${part.inlineData.data}`;
        diagramCache.set(prompt, base64Data);
        return base64Data;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const generateLearningPlan = async (
  college: string,
  subject: string,
  semester: string,
  pyqInfo?: string,
  syllabusFiles: UploadedFile[] = []
): Promise<string> => {
  // Security Validation
  const validSyllabusFiles = syllabusFiles.filter(f => validateFile(f));

  // Sanitization
  const safeCollege = sanitizeInput(college);
  const safeSubject = sanitizeInput(subject);
  const safeSemester = sanitizeInput(semester);

  const model = "gemini-2.5-flash";

  const prompt = `
ROLE:
You are an exam-oriented academic planner and resource discovery engine.
Your priority is freshness, reliability, and exam relevance.

TASK:
Generate a unit-wise learning path aligned with the given syllabus.
For each unit, identify the best learning resources using up-to-date information.
Provide SEARCHABLE  authoritative resource TITLES + SOURCES that are timeless TITLES instead of direct URLs to avoid dead links.

INPUTS:
College Name: ${safeCollege || "Not specified"}
Subject: ${safeSubject}
Semester: ${safeSemester || "Not specified"}
Syllabus: (Refer to attached images/PDFs)

RESOURCE DISCOVERY TECHNIQUE (MANDATORY):

Step 1: Syllabus Decomposition
- Split the syllabus into clearly separated units.
- Identify core topics per unit.
- Units must NEVER be merged.

Step 2: Resource Identification (Latest-Focused)
For each unit, identify  authoritative resource TITLES + SOURCES that are timeless, high-quality resources from:
- YouTube Videos / Playlists
- Written Tutorials
- Official Documentation
- Lecture Notes (PDF)
- Open Textbooks
- Research Papers
- Technical Blogs

Step 3: Resource Filtering Rules
- Prefer authoritative resource TITLES + SOURCES that are timeless and actively maintained content.
- Exclude broken, outdated, or deprecated pages.
- Avoid promotional or low-authority sources.
- Avoid duplicate or near-duplicate resources.

Step 4: Resource Ranking Criteria
Rank resources based on:
- Syllabus coverage
- Concept clarity
- Exam relevance
- Source credibility
- Recency

Select the top  resources  per unit that on completion of that I should get complete chapter.

Step 5: Output as Searchable Titles
- provide direct URLs.
- Provide accurate, searchable resource titles.
- Include source/platform name to make searching easy.
- Titles must be specific enough to locate the resource reliably.

PDF-SAFE FORMATTING RULES (CRITICAL):
- Keep each line under 80 characters for A4 margins.
- Use short paragraphs (2-3 sentences max).
- Add blank lines between sections.
- Avoid wide tables - max 3 narrow columns.
- Use bullet points instead of long paragraphs.
- Plain text only - compatible with Word/Google Docs.

OUTPUT FORMAT (STRICT — FOLLOW EXACTLY):

UNIT {{number}}: {{unit_title}}

Core Topics:
- Topic 1
- Topic 2
...

Resources:

YouTube Videos / Playlists:
1. Title: [Specific Video Title]
   Channel Name: [Channel Name]
   Why it is useful: [Reason]

Written Tutorials:
1. Title: [Article Title]
  Platform / Source: [Website Name]
  Why it is useful: [Reason]

Official Documentation:
1. Title: [Doc Title]
   Organization: [Org Name]
   Why it is useful: [Reason]

Lecture Notes (PDF):
1. Title: [Notes Title]
   University / Institution: [Uni Name]
   Why it is useful: [Reason]

Open Textbooks:
1. Title: [Book Title]
   Author / Publisher: [Author Name]
   Why it is useful: [Reason]

Research Papers:
1. Title: [Paper Title]
    Research Area / Publisher: [Publisher]
   Why it is useful: [Reason]

Technical Blogs:
1. Title: [Blog Title]
 Author / Platform: [Author/Site]
   Why it is useful: [Reason]

Practice Guidance:
- [Guidance point]

Estimated Study Time:
- [X hours]

GLOBAL ENFORCEMENT RULES:
- Do NOT mix resources across units.
- Do NOT repeat the same resource in multiple units.
- Prefer titles that are easy to find via Google or platform search.
- If no reliable resource exists for a category, explicitly state:
  "No reliable recent resource identified."

FINAL OUTPUT RULE:
Return ONLY the learning path content.
Do NOT include explanations, reasoning steps, or meta commentary.
`;

  try {
    const fileParts = validSyllabusFiles.map(file => ({
      inlineData: { data: file.base64, mimeType: file.mimeType },
    }));

    const response = await genAI.models.generateContent({
      model,
      contents: { parts: [...fileParts, { text: prompt }] },
    });
    return response.text || "Failed to generate plan.";
  } catch (error) {
    console.error("Plan Error:", error);
    throw error;
  }
};

export interface ClarifierVideo {
  title: string;
  channel: string;
  description: string;
  searchQuery: string;
}

export const getTopicVideoResources = async (topic: string): Promise<ClarifierVideo[]> => {
  const safeTopic = sanitizeInput(topic);
  const model = "gemini-2.5-flash-lite";
  const prompt = `Find 5 best free educational video resources for the topic: "${safeTopic}".
  Focus on high-quality explanations (English, Hindi, or Telugu).
  
  Return a JSON array of objects:
  [
    {
      "title": "Video Title",
      "channel": "Channel Name",
      "description": "Short summary",
      "searchQuery": "Exact YouTube search query"
    }
  ]`;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              channel: { type: Type.STRING },
              description: { type: Type.STRING },
              searchQuery: { type: Type.STRING },
            },
            required: ["title", "channel", "description", "searchQuery"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]") as ClarifierVideo[];
  } catch (error) {
    console.error("Video Error:", error);
    return [];
  }
};

export const getTopicZeroToHero = async (topic: string): Promise<string> => {
  const safeTopic = sanitizeInput(topic);
  const model = "gemini-2.5-flash";
  const prompt = `You are an expert academic curriculum analyst.
  
  INPUT: Topic Name: ${safeTopic}

  ════════════════════════════════
  MODE 2 — TOPIC CLARITY & MASTERY (ACTIVATE THIS MODE)
  ════════════════════════════════

  PDF-SAFE FORMATTING RULES (MANDATORY):
  - Keep each line under 80 characters for A4 page margins.
  - Use short paragraphs (3-4 sentences maximum).
  - Add blank lines between sections for readability.
  - Avoid wide tables - use maximum 3 narrow columns.
  - Use bullet points instead of long sentences.
  - Plain text only - no special Unicode characters.
  - Output must be compatible with Word/Google Docs export.

  OUTPUT STRUCTURE (Use strictly):

  1. Concept Explanation
     • Clear definition
     • Intuition and real-world analogy
     • Step-by-step breakdown (no fluff)

  2. Core Sub-Concepts
     • Bullet list of all essential subtopics
     • Highlight exam-critical points

  3. Common Mistakes & Misconceptions
     • What students usually get wrong
     • How to avoid it

  4. Mastery Path (Deep Learning Plan)
     Level 1 – Foundation
     • Beginner-friendly resources/steps
     Level 2 – Application
     • Problem-solving/examples
     Level 3 – Advanced / Exam-Oriented
     • Advanced notes/papers

  5. Best Resources for Mastery
     • English
     • English + Telugu
     • English + Hindi
     (Provide 1 top resource for each with URL)
  `;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
    });
    return response.text || "Failed to generate explanation.";
  } catch (error) {
    console.error("Hero Error:", error);
    throw error;
  }
};

/**
 * Fetch latest web resources for a topic using the web scraper
 */
export const getLatestWebResources = async (
  topic: string,
  resourceType: 'video' | 'tutorial' | 'documentation' | 'all' = 'all'
): Promise<SearchResult[]> => {
  try {
    const resources = await fetchLatestResources(topic, resourceType);
    return resources;
  } catch (error) {
    console.error("Web Resources Error:", error);
    return [];
  }
};

/**
 * Enhanced video resources with live web search
 */
export const getTopicVideoResourcesWithWebSearch = async (
  topic: string
): Promise<{ aiSuggestions: ClarifierVideo[]; webResults: SearchResult[] }> => {
  try {
    // Fetch AI suggestions and web results in parallel
    const [aiSuggestions, webResults] = await Promise.all([
      getTopicVideoResources(topic),
      searchWebResources(`${topic} tutorial video explanation youtube`, 5)
    ]);

    return { aiSuggestions, webResults };
  } catch (error) {
    console.error("Enhanced Video Error:", error);
    return { aiSuggestions: [], webResults: [] };
  }
};

/**
 * Search for latest resources across the web
 */
export const searchLatestResources = async (
  query: string,
  limit: number = 5
): Promise<SearchResult[]> => {
  try {
    return await searchWebResources(query, limit);
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
};

// Re-export types for convenience
export type { SearchResult } from "./webScraperService";

const roadmapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overview: { type: Type.STRING },
    youtubeFoundation: {
      type: Type.OBJECT,
      properties: {
        beginner: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              channel: { type: Type.STRING },
              searchQuery: { type: Type.STRING },
            },
            required: ["title", "channel", "searchQuery"]
          }
        },
        intermediate: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              channel: { type: Type.STRING },
              searchQuery: { type: Type.STRING },
            },
            required: ["title", "channel", "searchQuery"]
          }
        },
        advanced: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              channel: { type: Type.STRING },
              searchQuery: { type: Type.STRING },
            },
            required: ["title", "channel", "searchQuery"]
          }
        }
      },
      required: ["beginner", "intermediate", "advanced"]
    },
    learningPath: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.STRING },
          description: { type: Type.STRING },
          practice: { type: Type.STRING },
        },
        required: ["step", "description", "practice"]
      }
    },
    researchPapers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          link: { type: Type.STRING },
          summary: { type: Type.STRING },
        },
        required: ["title", "link", "summary"]
      }
    },
    dependencyMap: {
      type: Type.OBJECT,
      properties: {
        prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
        currentSkill: { type: Type.STRING },
        advancedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["prerequisites", "currentSkill", "advancedTopics"]
    },
  },
  required: ["overview", "youtubeFoundation", "learningPath", "researchPapers", "dependencyMap"],
};

export const generateSkillRoadmap = async (
  topic: string,
  goal: string
): Promise<SkillRoadmap> => {
  const safeTopic = sanitizeInput(topic);
  const safeGoal = sanitizeInput(goal);
  const model = "gemini-2.5-flash";

  const prompt = `
    ROLE: You are an elite academic mentor and industry specialist.
    TASK: Generate a comprehensive, high-resolution skill mastery roadmap for the following:
    
    TOPIC: ${safeTopic}
    LEARNING GOAL: ${safeGoal}
    CONTEXT: The user wants a complete "Zero to Hero" path to follow blindly.

    SECTIONS TO GENERATE:
    1. Skill Overview: A high-impact summary of what this skill entails and why it matters for the goal.
    2. YouTube Foundation Resources:
       - Divide into 'beginner', 'intermediate', and 'advanced' levels.
       - Select 2-3 high-quality resources per level.
       - Prefer PLAYLISTS over single videos.
       - Avoid repeating the same channel excessively.
       - Output only Searchable Title and Channel Name.
    3. Guided Learning Path: 
       - A strict, linear, step-by-step roadmap from Absolute Beginner to Mastery.
       - For each step, include a 'practice' field with specific FREE practice resources (e.g., LeetCode problems, specific project ideas, Kaggle datasets, or free documentation links).
    4. Research Paper Navigator:A student-friendly research reading plan.

Rules:
- Select only open-access research papers
- Prefer survey or overview papers first
- Avoid overly dense papers for beginners
- Do not include direct links
- Output searchable paper titles only

Structure:
Phase 1: Must Read (Foundation)
Phase 2: Core Papers
Phase 3: Advanced / Optional

For each paper:
- Why this paper matters (1–2 lines)
- What to focus on while reading
    5. Concept Dependency Map: Identify exactly what should be known BEFORE (prerequisites) and what to learn AFTER (advanced topics).

    RULES:
    - Keep it academic, clean, and highly structured.
    - Resources must be searchable.
    - The content must be tailored specifically to the user's GOAL and LEVEL.
  `;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: roadmapSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as SkillRoadmap;
  } catch (error) {
    console.error("Skill Roadmap Error:", error);
    throw error;
  }
};