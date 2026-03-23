import Navigation from './components/Navigation';
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from 'react';
import { convertUser, supabaseClient } from './supabase';
import { useApp } from './AppContext';

export default function Layout() {
  const { setCurrentUser } = useApp();
  const navigate = useNavigate();
  
  useEffect(() => {
    supabaseClient.auth.getSession().then(result => {
      const { data: { session } } = result;
      if (session) {
        const user = session.user;
        const appUser = session ? convertUser(user) : null;
        if (appUser) {
          setCurrentUser(appUser);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }).catch(error => {
      console.log(error);
    });
  }, []);
  
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
}