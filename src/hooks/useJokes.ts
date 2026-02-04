'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import type { Joke, JokeStyle, JokeCategory } from '@/types';

interface JokeFilters {
  style?: JokeStyle;
  category?: JokeCategory;
  minScore?: number;
  maxScore?: number;
  startDate?: string;
  endDate?: string;
  isFreeform?: boolean;
  search?: string;
}

export function useJokes() {
  const { user, jokes, setJokes, addJoke, updateJoke, deleteJoke } = useStore();
  const supabase = createClient();

  const fetchJokes = useCallback(async (filters?: JokeFilters) => {
    if (!user) return;

    let query = supabase
      .from('jokes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filters?.style) {
      query = query.eq('style', filters.style);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.minScore !== undefined) {
      query = query.gte('score', filters.minScore);
    }
    if (filters?.maxScore !== undefined) {
      query = query.lte('score', filters.maxScore);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.isFreeform !== undefined) {
      query = query.eq('is_freeform', filters.isFreeform);
    }
    if (filters?.search) {
      query = query.ilike('joke_text', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching jokes:', error);
      return;
    }

    setJokes(data as Joke[]);
  }, [user, supabase, setJokes]);

  useEffect(() => {
    fetchJokes();
  }, [fetchJokes]);

  const createJoke = async (jokeData: Omit<Joke, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('jokes')
      .insert({
        ...jokeData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    addJoke(data as Joke);

    // Increment jokes_this_month
    await supabase
      .from('users')
      .update({ jokes_this_month: user.jokes_this_month + 1 })
      .eq('id', user.id);

    return data as Joke;
  };

  const editJoke = async (id: string, updates: Partial<Joke>) => {
    const { error } = await supabase
      .from('jokes')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    updateJoke(id, updates);
  };

  const removeJoke = async (id: string) => {
    const { error } = await supabase
      .from('jokes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    deleteJoke(id);
  };

  return {
    jokes,
    fetchJokes,
    createJoke,
    editJoke,
    removeJoke,
  };
}
