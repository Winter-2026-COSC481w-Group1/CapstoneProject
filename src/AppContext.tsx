import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, LibraryFile, Assessment, Activity } from './types';
import { supabaseClient } from './supabase';
import { get } from './api';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  libraryFiles: LibraryFile[];
  setLibraryFiles: (files: LibraryFile[] | ((prevFiles: LibraryFile[]) => LibraryFile[])) => void;
  fetchLibraryFiles: () => Promise<void>;
  assessments: Assessment[];
  setAssessments: (assessments: Assessment[]) => void;
  fetchAssessments: () => Promise<void>;
  currentAssessment: Assessment | null;
  setCurrentAssessment: (assessment: Assessment | null) => void;
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'exam-created',
    description: 'Created Biology Chapter 5 - Cell Structure Quiz',
    timestamp: new Date('2024-01-16T10:30:00')
  },
  {
    id: '2',
    type: 'file-uploaded',
    description: 'Uploaded Introduction to Biology - Chapter 5.pdf',
    timestamp: new Date('2024-01-15T14:20:00')
  },
  {
    id: '3',
    type: 'exam-completed',
    description: 'Completed World History - Industrial Revolution (Score: 85%)',
    timestamp: new Date('2024-01-10T16:45:00')
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchLibraryFiles();
      fetchAssessments();
    }
  }, [currentUser]);

  const fetchLibraryFiles = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        console.error('no session token available');
        return;
      }
      const data = await get('api/v1/documents', session.access_token);
      const files: LibraryFile[] = data.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        size: doc.size
          ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB`
          : '0 MB',
        uploadedAt: new Date(doc.uploadedAt),
        status: doc.status as 'ready' | 'indexing' | 'processing' | 'pending' | 'failed',
        pageCount: doc.pageCount ?? 0,
      })).sort((a: LibraryFile, b: LibraryFile) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      setLibraryFiles(files);

      // Check if any files are either pending/processing/indexing
      if (files.some(file => file.status !== 'ready' && file.status !== 'failed')) {
        setTimeout(() => {
          fetchLibraryFiles();
        }, 3000); // wait 3 seconds
      }
    } catch (err) {
      console.error('error loading documents', err);
    }
  };

  const fetchAssessments = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        console.error('no session token available');
        return;
      }

      // Fetch all assessments
      const data = await get('api/v1/assessments', session.access_token); // fetch assessments
      const assessments: Assessment[] = data.map((ass: any) => ({
        id: ass.id,
        title: ass.title,
        topic: ass.topic || '', // !!! backend should return this maybe
        createdAt: new Date(ass.createdAt),
        status: ass.status as 'completed' | 'pending' | 'failed',
        sourceFiles: [ass.sourceFiles], // !!! Backend returns single document_id; wrap in array for now
        questionCount: ass.questionCount,
        difficulty: ass.difficulty as 'easy' | 'medium' | 'hard' | 'none',
        questions: [], // !!! Not provided by get assessments endpoint; initialize empty
        bestScore: undefined, // !!! Not provided; set later if needed
        lastScore: undefined, // !!! Not provided; set later if needed
        attempts: { attempts: [], scores: [] }, // !!! Default empty
      })).sort((a: Assessment, b: Assessment) => b.createdAt.getTime() - a.createdAt.getTime());

      // Fetch questions
      for (const ass of assessments) {
        const details = await get(`api/v1/assessments/${ass.id}`, session.access_token);
        ass.questions = details.questions.map((que: any) => ({
          id: que.id,
          type: que.type,
          question: que.question,
          numOptions: que.options.length, // !!! consider removing?
          options: que.options,
          correctAnswer: que.correctAnswer,
          userAnswer: que.userAnswer,
          source: que.source,
        }));
        ass.lastAttempt = details.lastAttempt;

        // Calculate and set lastScore from attempt data
        if (ass.lastAttempt && ass.lastAttempt.answers) {
          const answersMap = new Map(
            ass.lastAttempt.answers.map((a: any) => [a.questionId, a.answer])
          );
          ass.questions = ass.questions.map((q: any) => ({
            ...q,
            userAnswer: answersMap.get(q.id) ?? q.userAnswer
          }));

          // Calculate score from attempt answers
          let correctCount = 0;
          for (const question of ass.questions) {
            const attemptAnswer = ass.lastAttempt.answers.find((a: any) => a.questionId === question.id);
            if (!attemptAnswer) continue;

            if (question.type === 'short-answer') {
              if (attemptAnswer.shortAnswerIsCorrect === true) {
                correctCount++;
              }
            } else { // MCQ or T/F
              if (attemptAnswer.answer === question.correctAnswer) {
                correctCount++;
              }
            }
          }
          ass.lastScore = ass.questions.length > 0 ? Math.round((correctCount / ass.questions.length) * 100) : 0;
        }
      }

      setAssessments(assessments);

      // Check if any assessments are either pending/processing
      if (assessments.some(ass => ass.status !== 'completed' && ass.status !== 'failed')) {
        setTimeout(() => {
          fetchAssessments();
        }, 10000); // wait 10 seconds
      }
    } catch (err) {
      console.error('error loading assessments', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        libraryFiles,
        setLibraryFiles,
        fetchLibraryFiles,
        assessments,
        setAssessments,
        fetchAssessments,
        currentAssessment,
        setCurrentAssessment,
        activities,
        setActivities,
        showMobileMenu,
        setShowMobileMenu
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
