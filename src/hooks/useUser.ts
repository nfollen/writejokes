'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import type { User } from '@/types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export function useUser() {
  const [loading, setLoading] = useState(true);
  const { user, setUser, setShowOnboarding } = useStore();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
        } else {
          setUser(profile as User);
          if (!profile.onboarding_complete) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error('Error in useUser:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUser(profile as User);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, setUser, setShowOnboarding]);

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
