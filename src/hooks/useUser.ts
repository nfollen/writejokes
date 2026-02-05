'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import type { User } from '@/types';

export function useUser() {
  const [loading, setLoading] = useState(true);
  const { user, setUser, setShowOnboarding } = useStore();
  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        sessionError 
      });
      
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile, error, status } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      console.log('Profile fetch:', { profile, error, status });

      if (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
      } else {
        setUser(profile as User);
        if (!profile.onboarding_complete) {
          setShowOnboarding(true);
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error in useUser:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, setUser, setShowOnboarding]);

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          fetchUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUser, supabase, setUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      setUser(profile as User);
    }
  };

  return { user, loading, signOut, refreshUser };
}
