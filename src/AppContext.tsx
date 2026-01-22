import { createContext, useContext, useState, ReactNode } from 'react';
import { User, LibraryFile, Assessment, Activity } from './types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  libraryFiles: LibraryFile[];
  setLibraryFiles: (files: LibraryFile[]) => void;
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

const mockUser: User = {
  id: '1',
  name: 'Dr. Sarah Chen',
  email: 'sarah.chen@university.edu',
  avatar: 'SC',
  sessionHash: 'a3f9c2b8-4e1d-7f2a-9b5c-3d8e6a1f4b7c'
};

const mockLibraryFiles: LibraryFile[] = [
  {
    id: '1',
    name: 'Introduction to Biology - Chapter 5.pdf',
    size: '2.4 MB',
    uploadedAt: new Date('2024-01-15'),
    status: 'ready',
    pageCount: 24
  },
  {
    id: '2',
    name: 'World History Vol. 2.pdf',
    size: '5.8 MB',
    uploadedAt: new Date('2024-01-14'),
    status: 'ready',
    pageCount: 156
  },
  {
    id: '3',
    name: 'Advanced Physics - Quantum Mechanics.pdf',
    size: '3.2 MB',
    uploadedAt: new Date('2024-01-13'),
    status: 'ready',
    pageCount: 89
  },
  {
    id: '4',
    name: 'Chemistry Fundamentals.pdf',
    size: '4.1 MB',
    uploadedAt: new Date('2024-01-12'),
    status: 'indexing',
    pageCount: 45
  },
  {
    id: '5',
    name: 'Literature Analysis - Shakespeare.pdf',
    size: '1.9 MB',
    uploadedAt: new Date('2024-01-11'),
    status: 'ready',
    pageCount: 67
  }
];

const mockAssessments: Assessment[] = [
  {
    id: '1',
    title: 'Biology Chapter 5 - Cell Structure Quiz',
    createdAt: new Date('2024-01-16'),
    status: 'draft',
    sourceFiles: ['Introduction to Biology - Chapter 5.pdf'],
    questionCount: 15,
    difficulty: 'medium',
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
    title: 'World History - Industrial Revolution',
    createdAt: new Date('2024-01-10'),
    status: 'completed',
    sourceFiles: ['World History Vol. 2.pdf'],
    questionCount: 20,
    difficulty: 'hard',
    score: 85,
    questions: []
  },
  {
    id: '3',
    title: 'Quantum Mechanics Fundamentals',
    createdAt: new Date('2024-01-08'),
    status: 'completed',
    sourceFiles: ['Advanced Physics - Quantum Mechanics.pdf'],
    questionCount: 12,
    difficulty: 'hard',
    score: 92,
    questions: []
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>(mockLibraryFiles);
  const [assessments, setAssessments] = useState<Assessment[]>(mockAssessments);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: (user) => {
          setCurrentUser(user);
          if (user) {
            setCurrentPage('dashboard');
          }
        },
        currentPage,
        setCurrentPage,
        libraryFiles,
        setLibraryFiles,
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

export { mockUser };
