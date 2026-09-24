import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/lib/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInDemo: (role: UserRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_PROFILES: Record<UserRole, Profile> = {
  ADMIN: {
    id: 'demo-admin',
    nombre_completo: 'Dr. Admin Demo',
    rol: 'ADMIN',
    email: 'admin@clinicapi.do',
    telefono: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  RECEPCIONISTA: {
    id: 'demo-recepcion',
    nombre_completo: 'Recepcionista Demo',
    rol: 'RECEPCIONISTA',
    email: 'recepcion@clinicapi.do',
    telefono: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  MEDICO: {
    id: 'demo-medico',
    nombre_completo: 'Dr. Médico Demo',
    rol: 'MEDICO',
    email: 'medico@clinicapi.do',
    telefono: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>('RECEPCIONISTA');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        if (data.session) {
          loadProfile(data.session.user.id);
        } else {
          const stored = localStorage.getItem('demoRole');
          if (stored) {
            const role = stored as UserRole;
            setProfile(DEMO_PROFILES[role]);
            setActiveRole(role);
            setIsDemoMode(true);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        (async () => {
          await loadProfile(newSession.user.id);
        })();
      } else {
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      setActiveRole((data as Profile).rol);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  function signInDemo(role: UserRole) {
    localStorage.setItem('demoRole', role);
    setProfile(DEMO_PROFILES[role]);
    setActiveRole(role);
    setIsDemoMode(true);
    setLoading(false);
  }

  async function signOut() {
    if (isDemoMode) {
      localStorage.removeItem('demoRole');
      setIsDemoMode(false);
    } else {
      await supabase.auth.signOut();
    }
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        activeRole,
        setActiveRole,
        isDemoMode,
        signIn,
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
