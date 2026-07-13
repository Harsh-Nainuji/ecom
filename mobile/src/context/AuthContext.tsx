import { 
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; fullName?: string; role?: 'buyer' | 'seller' }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as Profile;
}

async function ensureProfile(userId: string, fullName?: string | null) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, full_name: fullName, role: 'buyer' }, { onConflict: 'id' });

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to upsert profile', error.message);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) {
        setProfile(null);
        return;
      }

      const existing = await fetchProfile(session.user.id);
      if (!existing) {
        await ensureProfile(session.user.id, session.user.user_metadata?.full_name);
        const created = await fetchProfile(session.user.id);
        setProfile(created);
      } else {
        setProfile(existing);
      }
    }

    loadProfile();
  }, [session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Sign in failed', error.message);
      throw error;
    }
  }, []);

  const signUp = useCallback(
    async ({ email, password, fullName, role }: { email: string; password: string; fullName?: string; role?: 'buyer' | 'seller' }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        Alert.alert('Sign up failed', error.message);
        throw error;
      }

      if (data.session?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: data.session.user.id, full_name: fullName, role: role ?? 'buyer' }, { onConflict: 'id' });
        if (profileError) console.warn('Failed to upsert profile', profileError.message);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Sign out failed', error.message);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [session, profile, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
