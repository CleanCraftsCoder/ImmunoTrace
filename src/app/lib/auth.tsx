import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, UserProfile } from './supabase';

// ─── Context Shape ───────────────────────────────
interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    profileData: Partial<UserProfile>
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== '' && url !== 'your_supabase_url_here';
};

// ─── Provider ────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user's profile row from the users table
  async function fetchProfile(userId: string) {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch (e) {
      console.warn('Profile fetch failed:', e);
    }
  }

  // Refresh profile (callable from outside)
  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured. Running in demo mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setUser(s?.user ? { id: s.user.id, email: s.user.email } : null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Subscribe to changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ? { id: s.user.id, email: s.user.email } : null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Auth Methods ──────────────────────────────

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      // Demo mode: simulate login
      setUser({ id: 'demo-user', email });
      setProfile({
        id: 'demo-user',
        email,
        name: 'Demo User',
        age: 25,
        blood_group: 'O+',
        height_cm: 170,
        weight_kg: 65,
        allergies: [],
        location: 'Demo City',
        phone: null,
        health_score: 85,
        created_at: new Date().toISOString(),
      });
      return { error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data?.session?.user) {
      const user = data.session.user;
      setUser({ id: user.id, email: user.email ?? undefined });
      await fetchProfile(user.id);
    }

    return { error: null };
  }

  async function signUp(
    email: string,
    password: string,
    profileData: Partial<UserProfile>
  ) {
    if (!isSupabaseConfigured()) {
      // Demo mode: simulate signup
      setUser({ id: 'demo-user', email });
      setProfile({
        id: 'demo-user',
        email,
        name: profileData.name || 'Demo User',
        age: profileData.age || 25,
        blood_group: profileData.blood_group || 'O+',
        height_cm: profileData.height_cm || 170,
        weight_kg: profileData.weight_kg || 65,
        allergies: profileData.allergies || [],
        location: profileData.location || 'Demo City',
        phone: null,
        health_score: 0,
        created_at: new Date().toISOString(),
      });
      return { error: null };
    }

    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        name: profileData.name || null,
        age: profileData.age || null,
        blood_group: profileData.blood_group || null,
        height_cm: profileData.height_cm || null,
        weight_kg: profileData.weight_kg || null,
        allergies: profileData.allergies || [],
        location: profileData.location || null,
        phone: null,
        health_score: 0,
      });

      if (profileError) {
        console.error('Profile insert error:', profileError);
        return { error: profileError.message };
      }

      if (data?.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email ?? undefined });
        await fetchProfile(data.session.user.id);
      }
    }

    return { error: null };
  }

  async function signOutUser() {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user) return { error: 'Not authenticated' };
    
    if (!isSupabaseConfigured()) {
      // Demo mode
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut: signOutUser,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
