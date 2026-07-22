import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

type AuthContextValue = {
  session: Session | null;
  user: Session['user'] | null;
  profile: Profile | null;
  isStaff: boolean;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<unknown>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    let active = true;

    if (!uid) {
      setProfile(null);
      setProfileLoading(false);
      return () => {
        active = false;
      };
    }

    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('id, full_name, email, is_staff, created_at')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('[Auth] Could not load profile', error);
        }
        setProfile((data as Profile) ?? null);
        setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    isStaff: profile?.is_staff ?? false,
    loading,
    profileLoading,
    signOut: () => supabase.auth.signOut(),
  }), [loading, profile, profileLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

/** Fetches is_staff for a freshly-created/logged-in session without waiting on React state. */
export async function fetchIsStaff(userId: string): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('is_staff').eq('id', userId).maybeSingle();
  return data?.is_staff ?? false;
}
