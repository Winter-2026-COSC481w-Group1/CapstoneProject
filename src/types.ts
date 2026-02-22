export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  sessionHash: string;
}

export interface LibraryFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: Date;
  status: 'pending' | 'failed' | 'ready' | 'indexing' | 'processing';
  pageCount: number;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  source?: {
    text: string;
    page: number;
    fileName: string;
  };
}

export interface Attempts {
  attempts: Question[][];
  scores: number[];
};


export interface Assessment {
  id: string;
  title: string;
  createdAt: Date;
  status: 'new' | 'completed';
  sourceFiles: string[];
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'none';
  questions: Question[];
  bestScore?: number;
  lastScore?: number;
  attempts: Attempts;
}

export interface Activity {
  id: string;
  type: 'exam-created' | 'file-uploaded' | 'exam-completed';
  description: string;
  timestamp: Date;
}
