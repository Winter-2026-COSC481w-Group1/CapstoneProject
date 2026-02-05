import { Bell, Menu, X } from 'lucide-react';
import { useApp } from '../AppContext';

export default function Navigation() {
  const { currentUser, currentPage, setCurrentPage, showMobileMenu, setShowMobileMenu } = useApp();

  if (!currentUser || currentPage === 'resetPass') return null;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'library', label: 'Library' },
    { id: 'exam-studio', label: 'Exam Studio' },
    { id: 'assessments', label: 'Assessments' }
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
        <div className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-lg rounded-full px-6 py-3 flex items-center gap-8 max-w-5xl w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <span className="font-bold text-gray-800 text-lg hidden sm:block">ScholarAI</span>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  currentPage === link.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>

            <button
              onClick={() => setCurrentPage('profile')}
              className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              {currentUser.avatar}
            </button>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {showMobileMenu && (
        <div className="fixed top-24 left-0 right-0 z-40 flex justify-center px-4 md:hidden">
          <div className="backdrop-blur-xl bg-white/90 border border-white/40 shadow-lg rounded-3xl p-4 w-full max-w-md">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setCurrentPage(link.id);
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all mb-2 ${
                  currentPage === link.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
