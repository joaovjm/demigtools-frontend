import React, { useEffect, useState } from 'react';
import supabase from '../helper/superBaseClient';

const AuthMonitor = () => {
  const [authState, setAuthState] = useState('Checking...');
  const [authEvents, setAuthEvents] = useState([]);

  useEffect(() => {
    
    // Check initial session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthMonitor - Session error:', error);
          setAuthState('Error checking session');
          return;
        }
        
        const hasSession = !!data.session;
        setAuthState(hasSession ? 'Authenticated' : 'Not authenticated');
      } catch (err) {
        setAuthState('Exception checking session');
      }
    };
    
    checkSession();
    
    // Set up auth listener
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const timestamp = new Date().toISOString();
      const newEvent = {
        time: timestamp,
        event: event,
        hasSession: !!session
      };
      
      setAuthEvents(prev => [newEvent, ...prev].slice(0, 5));
      setAuthState(!!session ? 'Authenticated' : 'Not authenticated');
    });
    
    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);
  
};

export default AuthMonitor; 