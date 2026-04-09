import Navigation from './components/Navigation';
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { convertUser, supabaseClient } from './supabase';
import { useApp } from './AppContext';
import { Loader2 } from 'lucide-react';
import { User } from './types';

export default function Layout() {
  const { setCurrentUser } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    supabaseClient.auth.getSession().then(result => {
      const { data: { session } } = result;
      if (session) {
        const user = session.user;
       setCurrentUser((prevUser: User | null) => {
        const appUser = convertUser(user);
        if (prevUser?.id !== appUser.id) {
          return appUser;
        }
        return prevUser; 
      });

    } else {
      navigate('/auth');
    }
  }).catch(error => {
    console.error('Auth error:', error);
    navigate('/auth');
  }).finally(() => {
    setIsLoading(false);
  });  
}, [navigate, setCurrentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin dark:text-emerald-400" />
      </div>
    );
  }
  
  return (
    <>
      <Navigation />
      <div className="pt-2 min-h-screen bg-stone-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
        <Outlet />
      </div>
    </>
  );
}