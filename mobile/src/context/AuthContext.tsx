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
import type { Profile, UserRole } from '../types/profile';
import { registerForPushNotificationsAsync } from '../lib/notifications';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  sellerProfile: any | null;
  activeRole: UserRole | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; fullName?: string; role?: 'buyer' | 'seller' | 'delivery' }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setActiveRole: (role: UserRole | null) => void;
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

async function fetchSellerProfile(userId: string) {
  const { data, error } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to fetch seller profile:', error.message);
    return null;
  }
  return data;
}

async function ensureProfile(userId: string, fullName?: string | null, role?: string | null) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, full_name: fullName, role: (role as any) ?? 'buyer' }, { onConflict: 'id' });

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to upsert profile', error.message);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sellerProfile, setSellerProfile] = useState<any | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setActiveRole(null);
        setProfileLoading(false);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const existing = await fetchProfile(session.user.id);
    setProfile(existing);

    if (existing?.role === 'seller') {
      const sellerData = await fetchSellerProfile(session.user.id);
      setSellerProfile(sellerData);
    } else {
      setSellerProfile(null);
    }
  }, [session]);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) {
        setProfile(null);
        setSellerProfile(null);
        setProfileLoading(false);
        return;
      }

      let existing = await fetchProfile(session.user.id);
      if (!existing) {
        await ensureProfile(
          session.user.id,
          session.user.user_metadata?.full_name,
          session.user.user_metadata?.role
        );
        existing = await fetchProfile(session.user.id);
      }
      setProfile(existing);
      
      // Register push token for notifications
      registerForPushNotificationsAsync(session.user.id);

      if (existing?.role === 'seller') {
        const sellerData = await fetchSellerProfile(session.user.id);
        setSellerProfile(sellerData);
      } else {
        setSellerProfile(null);
      }
      setProfileLoading(false);
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
    async ({ email, password, fullName, role }: { email: string; password: string; fullName?: string; role?: 'buyer' | 'seller' | 'delivery' }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role ?? 'buyer',
          },
        },
      });

      if (error) {
        Alert.alert('Sign up failed', error.message);
        throw error;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: data.user.id, full_name: fullName, role: role ?? 'buyer' }, { onConflict: 'id' });
        if (profileError) console.warn('Failed to upsert profile', profileError.message);
      }

      if (!data.session) {
        Alert.alert(
          'Verification Email Sent',
          'Please verify your email address by clicking the link sent to your inbox, then sign in.'
        );
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
      sellerProfile,
      activeRole,
      loading,
      profileLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      setActiveRole,
    }),
    [session, profile, sellerProfile, activeRole, loading, profileLoading, signIn, signUp, signOut, refreshProfile],
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
