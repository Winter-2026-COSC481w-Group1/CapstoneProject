export interface User {
  id: string;
  name?: string;
  email: string;
  avatar: string;
}

export interface LibraryFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: Date;
  status: 'pending' | 'failed' | 'ready' | 'indexing' | 'processing';
  pageCount: number;
  sections?: { title: string; page_number: number }[];
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  numOptions: number
  options?: string[];
  correctAnswer: number | string;
  source?: {
    text: string;
    page: number;
    document_id: string;
    document_name?: string;
  };
}

export interface AttemptAnswer {
  questionId: string;
  answer: number | boolean | string;
  shortAnswerIsCorrect?: boolean | null;
}

export interface AssessmentAttemptRequest {
  answers: AttemptAnswer[];
}

export interface AssessmentAttempt {
  numAttempts?: number;
  numCorrect?: number;
  timeSubmitted?: string;
  time_submitted?: string;
  answers: AttemptAnswer[];
}

export interface Assessment {
  id: string;
  title: string;
  topic: string;
  createdAt: Date;
  status: 'ready' | 'completed' | 'processing' | 'pending' | 'failed';
  sourceFiles: string[];
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'none';
  numAttempts: number;
  numCorrect: number;
  questions: Question[];
  attempt?: AssessmentAttempt;
}

export interface Activity {
  id: string;
  type: 'exam-created' | 'file-uploaded' | 'exam-completed';
  name: string;
  timestamp: Date;
}

export interface TrashedDocument {
  id: string;
  name: string;
  size: string;
  uploadedAt: Date;
  status: string;
  pageCount: number;
  deletedAt: Date;
  daysRemaining: number;
}

export interface TrashedAssessment {
  id: string;
  title: string;
  topic: string;
  createdAt: Date;
  status: string;
  sourceFiles: string[];
  questionCount: number;
  difficulty: string;
  deletedAt: Date;
  daysRemaining: number;
}
