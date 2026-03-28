import Navigation from './components/Navigation';
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { convertUser, supabaseClient } from './supabase';
import { useApp } from './AppContext';
import { Loader2 } from 'lucide-react';

export default function Layout() {
  const { setCurrentUser } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    supabaseClient.auth.getSession().then(result => {
      const { data: { session } } = result;
      if (session) {
        const user = session.user;
        const appUser = convertUser(user);
        if (appUser) {
          setCurrentUser(appUser);
        } else {
          navigate('/auth');
        }
      } else {
        navigate('/auth');
      }
    }).catch(error => {
      console.error('Auth error:', error);
      navigate('/auth');
    }).finally(() => {
      setIsLoading(false);
    });
  }, [setCurrentUser, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <>
      <Navigation />
      <div className="pt-2">
        <Outlet />
      </div>
    </>
  );
}