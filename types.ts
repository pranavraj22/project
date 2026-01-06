export interface QA {
  question: string;
  answer: string;
  diagramPrompt?: string; // Optional field for image generation (flowcharts, tables, diagrams)
}

export interface ExamData {
  topicName: string;
  veryShortQuestions: QA[];
  shortQuestions: QA[];
  longQuestions: QA[];
  numericals: QA[];
  examinerNotes: string[];
  youtubeQueries: string[];
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface UserDetails {
  college: string;
  subject: string;
  semester: string;
  examType: string;
  units?: string;
}

export interface SkillRoadmap {
  overview: string;
  youtubeFoundation: {
    beginner: {
      title: string;
      channel: string;
      searchQuery: string;
    }[];
    intermediate: {
      title: string;
      channel: string;
      searchQuery: string;
    }[];
    advanced: {
      title: string;
      channel: string;
      searchQuery: string;
    }[];
  };
  learningPath: {
    step: string;
    description: string;
    practice: string;
  }[];
  researchPapers: {
    title: string;
    link: string;
    summary: string;
  }[];
  dependencyMap: {
    prerequisites: string[];
    currentSkill: string;
    advancedTopics: string[];
  };
}

export interface ResourceItem {
  title: string;
  sourceLabel?: string;
  sourceValue?: string;
  description?: string;
}

export interface ResourceCategory {
  type: string;
  items: ResourceItem[];
}

export interface ParsedUnit {
  title: string;
  coreTopics: string[];
  resources: ResourceCategory[];
  practiceGuidance: string[];
  studyTime: string;
}