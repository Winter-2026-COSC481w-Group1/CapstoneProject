import Navigation from './components/Navigation';
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from 'react';
import { supabaseClient } from './supabase';
import { useApp } from './AppContext';

export default function Layout() {
  const { setCurrentUser } = useApp();
  const navigate = useNavigate();
  
  useEffect(() => {
    supabaseClient.auth.getSession().then(result => {
      const { data: { session } } = result;
      if (session) {
        const user = session.user;
        const realUser = session ? {
          id: user.id,
          name: user.user_metadata.full_name,
          email: user.email!,
          avatar: user.user_metadata.full_name.match(/\b(\w)/g).join(''),
          sessionHash: 'something' // TODO remove this field or populate with useful data
        } : null;
        if (realUser) {
          setCurrentUser(realUser);
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