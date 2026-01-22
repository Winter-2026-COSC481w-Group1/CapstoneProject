import { AppProvider, useApp } from './AppContext';
import Navigation from './components/Navigation';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import ExamStudio from './components/ExamStudio';
import LoadingRoom from './components/LoadingRoom';
import AssessmentsHub from './components/AssessmentsHub';
import ExamMode from './components/ExamMode';
import GradingReport from './components/GradingReport';
import Profile from './components/Profile';

function AppContent() {
  const { currentPage } = useApp();

  return (
    <>
      <Navigation />
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'auth' && <AuthPage />}
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'library' && <Library />}
      {currentPage === 'exam-studio' && <ExamStudio />}
      {currentPage === 'loading' && <LoadingRoom />}
      {currentPage === 'assessments' && <AssessmentsHub />}
      {currentPage === 'exam-mode' && <ExamMode />}
      {currentPage === 'grading-report' && <GradingReport />}
      {currentPage === 'profile' && <Profile />}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
