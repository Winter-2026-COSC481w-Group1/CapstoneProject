import { CircleQuestionMark, ExternalLink, Menu, MoonStar, SunMedium, X } from 'lucide-react';
import { useApp } from '../AppContext';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Navigation() {
  const { currentUser, showMobileMenu, setShowMobileMenu, theme, setTheme } = useApp();
  const [showBugReportMenu, setShowBugReportMenu] = useState(false);
  const location = useLocation();

  if (!currentUser) return null;

  const navLinks = [
    { id: '/dashboard/home', label: 'Home' },
    { id: '/dashboard/library', label: 'Library' },
    { id: '/dashboard/exam-studio', label: 'Exam Studio' },
    { id: '/dashboard/assessments', label: 'Assessments' },
    { id: '/dashboard/trash', label: 'Trash' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
        <div className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-lg rounded-full px-6 py-3 flex items-center gap-8 max-w-5xl w-full dark:bg-slate-900/80 dark:border-slate-700/60 dark:shadow-black/20">
          <div className="flex items-center gap-3">
            <img src="/examable.svg" alt="Examable" className="w-8 h-8" />
            <span className="font-bold text-gray-800 text-lg hidden sm:block dark:text-slate-100">Examable</span>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.id}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  location.pathname === link.id
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="relative">
              <button type="button" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-slate-800" onClick={() => { setShowBugReportMenu(!showBugReportMenu); }}>
                <CircleQuestionMark className="w-5 h-5 text-gray-600 dark:text-slate-300" />
              </button>
              {showBugReportMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[180px] z-10 dark:bg-slate-900 dark:border-slate-700">
                  <a className="inline-flex w-full text-left px-4 py-2 hover:bg-emerald-50 text-sm font-medium text-gray-700 dark:text-slate-200 dark:hover:bg-slate-800" href="https://docs.google.com/forms/d/e/1FAIpQLSfHOyMmNEj4jzZT_MQoPgkXWuzxD2Bwr_Lv_G7fUOKGTOXTBQ/viewform?usp=publish-editor" target="_blank" rel="noreferrer">
                      <span>Report an issue</span>
                      <ExternalLink className="w-4 h-4 text-gray-700 ms-auto my-auto dark:text-slate-200" />
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors dark:hover:bg-slate-800"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? (
                <SunMedium className="w-5 h-5 text-amber-300" />
              ) : (
                <MoonStar className="w-5 h-5 text-slate-600" />
              )}
            </button>
            
            <NotificationBell />

            <Link
              to='profile'
              className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-emerald-700 transition-colors dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              {currentUser.avatar}
            </Link>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-slate-800"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5 text-gray-600 dark:text-slate-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {showMobileMenu && (
        <div className="fixed top-24 left-0 right-0 z-40 flex justify-center px-4 md:hidden">
          <div className="backdrop-blur-xl bg-white/90 border border-white/40 shadow-lg rounded-3xl p-4 w-full max-w-md dark:bg-slate-900/95 dark:border-slate-700/60">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.id}
                onClick={() => {
                  setShowMobileMenu(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all mb-2 ${
                  location.pathname === link.id
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}