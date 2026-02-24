import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, LibraryFile, Assessment, Activity } from './types';
import { supabaseClient } from './supabase';
import { get } from './api';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  libraryFiles: LibraryFile[];
  setLibraryFiles: (files: LibraryFile[] | ((prevFiles: LibraryFile[]) => LibraryFile[])) => void;
  fetchLibraryFiles: () => Promise<void>;
  assessments: Assessment[];
  setAssessments: (assessments: Assessment[]) => void;
  currentAssessment: Assessment | null;
  setCurrentAssessment: (assessment: Assessment | null) => void;
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockAssessments: Assessment[] = [
  {
    id: '1',
    title: 'Biology Chapter 5 - Cell Structure Quiz',
    createdAt: new Date('2024-01-16'),
    status: 'completed',
    sourceFiles: ['Introduction to Biology - Chapter 5.pdf'],
    questionCount: 15,
    difficulty: 'medium',
    bestScore: 80,
    lastScore: 79,
    attempts: {
      attempts: [[]],
      scores: []
    },
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Where does photosynthesis occur in plant cells?',
        options: ['Mitochondria', 'Chloroplasts', 'Nucleus', 'Cell membrane'],
        correctAnswer: 'Chloroplasts',
        source: {
          text: '...photosynthesis occurs in the chloroplasts, specialized organelles that contain chlorophyll and convert light energy into chemical energy...',
          page: 12,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'What is the primary function of mitochondria?',
        options: ['Protein synthesis', 'Energy production', 'Waste removal', 'Cell division'],
        correctAnswer: 'Energy production',
        source: {
          text: '...mitochondria are known as the powerhouse of the cell, responsible for producing ATP through cellular respiration...',
          page: 15,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      },
      {
        id: 'q3',
        type: 'true-false',
        question: 'The cell membrane is selectively permeable.',
        correctAnswer: 'True',
        source: {
          text: '...the cell membrane exhibits selective permeability, allowing certain molecules to pass while blocking others...',
          page: 8,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      },
      {
        id: 'q4',
        type: 'multiple-choice',
        question: 'Which organelle contains the cell\'s genetic material?',
        options: ['Ribosome', 'Golgi apparatus', 'Nucleus', 'Lysosome'],
        correctAnswer: 'Nucleus',
        source: {
          text: '...the nucleus serves as the control center of the cell, housing DNA and directing cellular activities...',
          page: 10,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      },
      {
        id: 'q5',
        type: 'short-answer',
        question: 'Explain the role of ribosomes in the cell.',
        correctAnswer: 'Ribosomes are responsible for protein synthesis by translating mRNA into polypeptide chains.',
        source: {
          text: '...ribosomes are the site of protein synthesis, where messenger RNA is translated into polypeptide chains...',
          page: 14,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      }
    ]
  },
  {
    id: '2',
    title: 'Second Mock test',
    createdAt: new Date('2024-01-16'),
    status: 'new',
    sourceFiles: ['Introduction to Biology - Chapter 5.pdf'],
    questionCount: 5,
    difficulty: 'hard',
    bestScore: undefined,
    lastScore: undefined,
    attempts: {
      attempts: [[]],
      scores: []
    },
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Where does photosynthesis occur in plant cells?',
        options: ['Mitochondria', 'Chloroplasts', 'Nucleus', 'Cell membrane'],
        correctAnswer: 'Chloroplasts',
        source: {
          text: '...photosynthesis occurs in the chloroplasts, specialized organelles that contain chlorophyll and convert light energy into chemical energy...',
          page: 12,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'What is the primary function of mitochondria?',
        options: ['Protein synthesis', 'Energy production', 'Waste removal', 'Cell division'],
        correctAnswer: 'Energy production',
        source: {
          text: '...mitochondria are known as the powerhouse of the cell, responsible for producing ATP through cellular respiration...',
          page: 15,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      },
      {
        id: 'q3',
        type: 'true-false',
        question: 'The cell membrane is selectively permeable.',
        correctAnswer: 'True',
        source: {
          text: '...the cell membrane exhibits selective permeability, allowing certain molecules to pass while blocking others...',
          page: 8,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      },
      {
        id: 'q4',
        type: 'multiple-choice',
        question: 'Which organelle contains the cell\'s genetic material?',
        options: ['Ribosome', 'Golgi apparatus', 'Nucleus', 'Lysosome'],
        correctAnswer: 'Nucleus',
        source: {
          text: '...the nucleus serves as the control center of the cell, housing DNA and directing cellular activities...',
          page: 10,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      },
      {
        id: 'q5',
        type: 'short-answer',
        question: 'Explain the role of ribosomes in the cell.',
        correctAnswer: 'Ribosomes are responsible for protein synthesis by translating mRNA into polypeptide chains.',
        source: {
          text: '...ribosomes are the site of protein synthesis, where messenger RNA is translated into polypeptide chains...',
          page: 14,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      }
    ]
  },
  {
    id: '3',
    title: 'Mock Test 3',
    createdAt: new Date('2024-01-16'),
    status: 'new',
    sourceFiles: ['Introduction to Biology - Chapter 5.pdf'],
    questionCount: 1,
    difficulty: 'easy',
    bestScore: undefined,
    lastScore: undefined,
    attempts: {
      attempts: [[]],
      scores: []
    },
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Where does photosynthesis occur in plant cells?',
        options: ['Mitochondria', 'Chloroplasts', 'Nucleus', 'Cell membrane'],
        correctAnswer: 'Chloroplasts',
        source: {
          text: '...photosynthesis occurs in the chloroplasts, specialized organelles that contain chlorophyll and convert light energy into chemical energy...',
          page: 12,
          fileName: 'Introduction to Biology - Chapter 5.pdf'
        }
      }
    ]
  }
];

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
  const firstPage = 'spinningCircle';
  const [currentPage, setCurrentPage] = useState(firstPage);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>(mockAssessments);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchLibraryFiles();
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
      }));
      setLibraryFiles(files);
    } catch (err) {
      console.error('error loading documents', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentPage,
        setCurrentPage: (page) => {
          localStorage.setItem('saved-page', page);
          setCurrentPage(page);
        },
        libraryFiles,
        setLibraryFiles,
        fetchLibraryFiles,
        assessments,
        setAssessments,
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
