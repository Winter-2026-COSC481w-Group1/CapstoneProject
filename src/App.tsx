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
import PassForgetPage from './components/PassForgetPage';
import ResetPassPage from './components/ResetPassPage';
import Layout from './Layout';
import { HashRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './AppContext';


function App() {
  return (
    <HashRouter>
      <AppProvider>
      <Routes>
        {/* Landing page*/ }
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth related pages */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/resetPass" element={<ResetPassPage />} />
        <Route path="/passForgetPage" element={<PassForgetPage />} />
        
        {/* Dashboard pages */}
        <Route path="/dashboard" element={<Layout />}>
          <Route path="home" element={<Dashboard />} />
          <Route path="library" element={<Library />} />
          <Route path="exam-studio" element={<ExamStudio />} />
          <Route path="loading" element={<LoadingRoom />} />
          <Route path="assessments" element={<AssessmentsHub />} />
          <Route path="exam-mode" element={<ExamMode />} />
          <Route path="grading-report" element={<GradingReport />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        </Routes>
      </AppProvider>
    </HashRouter>
  );
}

export default App;
