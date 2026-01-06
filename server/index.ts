/**
 * Backend Server for Note2Exam AI
 * 
 * This server handles all Gemini API calls server-side.
 * The API key is stored ONLY here (via environment variables),
 * never exposed to the browser.
 */

// Load environment variables from .env file
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ExamData, UploadedFile, SkillRoadmap } from '../types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for base64 file uploads

// Initialize Gemini client with server-side API key
const apiKey = process.env.GEMINI_API_KEY || process.env.Api_name;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY environment variable is not set!');
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

// Simple memory cache for diagram images (server-side)
const diagramCache = new Map<string, string>();

// ============================================================================
// SCHEMAS (same as frontend expects)
// ============================================================================

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

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/generate-exam
 * Generates exam questions from uploaded files
 */
app.post('/api/generate-exam', async (req, res) => {
  try {
    const { lectureFiles, syllabusFiles, details, prompt } = req.body;

    // Use a faster, lower-latency model for exam generation
    // This significantly reduces wait time, especially for large PDFs.
    const model = "gemini-2.5-flash-lite";

    const lectureParts = (lectureFiles || []).map((file: UploadedFile) => ({
      inlineData: { data: file.base64, mimeType: file.mimeType },
    }));

    const syllabusParts = (syllabusFiles || []).map((file: UploadedFile) => ({
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
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const examData = JSON.parse(text) as ExamData;
    res.json(examData);
  } catch (error: any) {
    console.error("Generate Exam Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate exam content" });
  }
});

/**
 * POST /api/diagram-image
 * Generates a diagram image from a prompt
 */
app.post('/api/diagram-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (diagramCache.has(prompt)) {
      const cached = diagramCache.get(prompt);
      return res.json({ imageBase64: cached?.split(',')[1] || null });
    }

    const model = "gemini-2.5-flash-image";
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
        return res.json({ imageBase64: part.inlineData.data });
      }
    }

    res.json({ imageBase64: null });
  } catch (error: any) {
    console.error("Diagram Image Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate diagram" });
  }
});

/**
 * POST /api/generate-learning-plan
 * Generates a learning plan from syllabus files
 */
app.post('/api/generate-learning-plan', async (req, res) => {
  try {
    const { syllabusFiles, college, subject, semester, pyqInfo, prompt } = req.body;

    const model = "gemini-2.5-flash";

    const fileParts = (syllabusFiles || []).map((file: UploadedFile) => ({
      inlineData: { data: file.base64, mimeType: file.mimeType },
    }));

    const response = await genAI.models.generateContent({
      model,
      contents: { parts: [...fileParts, { text: prompt }] },
    });

    const text = response.text || "Failed to generate plan.";
    res.setHeader('Content-Type', 'text/plain');
    res.send(text);
  } catch (error: any) {
    console.error("Learning Plan Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate learning plan" });
  }
});

/**
 * POST /api/topic-videos
 * Gets video resources for a topic
 */
app.post('/api/topic-videos', async (req, res) => {
  try {
    const { topic, prompt } = req.body;

    const model = "gemini-2.5-flash-lite";

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

    const videos = JSON.parse(response.text || "[]");
    res.json(videos);
  } catch (error: any) {
    console.error("Topic Videos Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch videos" });
  }
});

/**
 * POST /api/topic-zero-to-hero
 * Gets zero-to-hero explanation for a topic
 */
app.post('/api/topic-zero-to-hero', async (req, res) => {
  try {
    const { topic, prompt } = req.body;

    const model = "gemini-2.5-flash";
    const response = await genAI.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
    });

    const text = response.text || "Failed to generate explanation.";
    res.setHeader('Content-Type', 'text/plain');
    res.send(text);
  } catch (error: any) {
    console.error("Zero to Hero Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate explanation" });
  }
});

/**
 * POST /api/skill-roadmap
 * Generates a skill mastery roadmap
 */
app.post('/api/skill-roadmap', async (req, res) => {
  try {
    const { topic, goal, prompt } = req.body;

    const model = "gemini-2.5-flash";

    const response = await genAI.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: roadmapSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const roadmap = JSON.parse(text) as SkillRoadmap;
    res.json(roadmap);
  } catch (error: any) {
    console.error("Skill Roadmap Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate roadmap" });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Note2Exam AI Backend Server' });
});

// Export for Vercel serverless functions
export default app;

// Start server (only in development/local)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📝 API key configured: ${apiKey ? 'Yes' : 'No'}`);
  });
}
