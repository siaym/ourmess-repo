import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentMess: any | null;
  systemRole: string;
  loading: boolean;
  loadingMess: boolean;
  refreshMess: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  currentMess: null,
  systemRole: 'user',
  loading: true,
  loadingMess: true,
  refreshMess: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [systemRole, setSystemRole] = useState<string>('user');
  const [currentMess, setCurrentMess] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMess, setLoadingMess] = useState(true);

  const fetchMessAndRole = async (userId: string) => {
    setLoadingMess(true);
    
    // Fetch system role
    const { data: userData } = await supabase
      .from('users')
      .select('system_role')
      .eq('id', userId)
      .single();
    if (userData) {
      setSystemRole(userData.system_role || 'user');
    }

    // Fetch mess
    const { data: memberData } = await supabase
      .from('mess_members')
      .select('mess_id')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .limit(1)
      .single();

    if (memberData) {
      const { data: messData } = await supabase
        .from('messes')
        .select('*')
        .eq('id', memberData.mess_id)
        .single();
      setCurrentMess(messData || null);
    } else {
      setCurrentMess(null);
    }
    setLoadingMess(false);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchMessAndRole(session.user.id);
      } else {
        setLoadingMess(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchMessAndRole(session.user.id);
      } else {
        setCurrentMess(null);
        setSystemRole('user');
        setLoadingMess(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshMess = async () => {
    if (user) {
      await fetchMessAndRole(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, currentMess, systemRole, loading, loadingMess, refreshMess, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
