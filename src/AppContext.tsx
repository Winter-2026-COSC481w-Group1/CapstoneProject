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
  fetchAssessmentDetails: (assessmentId: string) => Promise<Assessment | null>;
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
        topic: ass.topic || '',
        createdAt: new Date(ass.createdAt),
        status: ass.status as 'ready' | 'completed' | 'processing' | 'pending' | 'failed',
        sourceFiles: ass.sourceFiles || [],
        questionCount: ass.questionCount,
        difficulty: ass.difficulty as 'easy' | 'medium' | 'hard' | 'none',
        numAttempts: ass.numAttempts,
        numCorrect: ass.numCorrect,
      })).sort((a: Assessment, b: Assessment) => b.createdAt.getTime() - a.createdAt.getTime());

      setAssessments(assessments);

      // Check if any assessments are either pending/processing
      if (assessments.some(ass => ass.status === 'pending' || ass.status === 'processing')) {
        setTimeout(() => {
          fetchAssessments();
        }, 5000); // Polling more frequently (5s instead of 10s)
      }
    } catch (err) {
      console.error('error loading assessments', err);
    }
  };

  const fetchAssessmentDetails = async (assessmentId: string): Promise<Assessment | null> => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return null;

      const assessmentData = await get(`api/v1/assessments/${assessmentId}`, session.access_token);
      const questions = assessmentData.questions.map((que: any) => ({
        id: que.id,
        type: que.type,
        question: que.question,
        numOptions: que.options ? que.options.length : 0,
        options: que.options,
        correctAnswer: que.correctAnswer,
        source: que.source,
      }));
      const attempt = {
        answers: assessmentData.attempt?.answers,
        timeSubmitted: assessmentData.attempt?.time_submitted,
      };

      // Construct the object directly from API data so it works 
      // even if the local 'assessments' list is still empty or stale.
      const updatedAssessment: Assessment = {
        id: assessmentData.id || assessmentId,
        title: assessmentData.title || 'Untitled Assessment',
        topic: assessmentData.topic || '',
        createdAt: assessmentData.createdAt ? new Date(assessmentData.createdAt) : new Date(),
        status: (assessmentData.status as any) || 'ready',
        sourceFiles: assessmentData.sourceFiles || [],
        questionCount: assessmentData.questionCount || questions.length,
        difficulty: (assessmentData.difficulty as any) || 'none',
        numAttempts: assessmentData.attempt?.numAttempts || 0,
        numCorrect: assessmentData.attempt?.numCorrect || 0,
        questions,
        attempt
      };

      setAssessments(prev => {
        const exists = prev.find(a => a.id === assessmentId);
        if (!exists) {
          return [updatedAssessment, ...prev];
        }
        return prev.map(ass => ass.id === assessmentId ? updatedAssessment : ass);
      });

      setCurrentAssessment(updatedAssessment);
      return updatedAssessment;
    } catch (err) {
      console.error('error loading assessment details', err);
      return null;
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
        fetchAssessmentDetails,
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
