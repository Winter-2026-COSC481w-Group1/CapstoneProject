import { useEffect } from 'react';
import { supabaseClient } from '../supabase';
import { useApp } from '../AppContext';
import '../spinner.css';

export default function AuthPage() {
  const { setCurrentUser, setCurrentPage } = useApp();
  
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
          const savedPage = localStorage.getItem('saved-page');
          if (savedPage === null) {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage(savedPage);
          }
        } else {
          setCurrentPage('landing');
        }
      } else {
        setCurrentPage('landing');
      }
    }).catch(error => {
      console.log(error);
    });
  });

  return (
      <div className="spinner"></div>
  );
}
