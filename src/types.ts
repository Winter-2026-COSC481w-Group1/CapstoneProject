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
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  numOptions: number
  options?: string[];
  correctAnswer: number | string;
  userAnswer?: number | string;
  source?: {
    text: string;
    page: number;
    fileName: string;
  };
}

/*export interface Attempts {
  attempts: Question[][];
  scores: number[];
};*/


export interface AttemptAnswer {
  questionId: string;
  answer: number | boolean | string;
  shortAnswerIsCorrect?: boolean | null;
}

export interface AssessmentAttemptRequest {
  answers: AttemptAnswer[];
}

export interface AssessmentAttempt {
  attempts: number;
  time_submitted: string;
  answers: AttemptAnswer[];
}

export interface Assessment {
  id: string;
  title: string;
  topic: string;
  createdAt: Date;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  sourceFiles: string[];
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'none';
  questions: Question[];
  lastScore?: number;
  /*bestScore?: number;
  lastScore?: number;
  attempts: Attempts;*/
  lastAttempt?: AssessmentAttempt;
}

export interface Activity {
  id: string;
  type: 'exam-created' | 'file-uploaded' | 'exam-completed';
  description: string;
  timestamp: Date;
}
