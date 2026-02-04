'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import type { SetList, SetListJoke, SetNotes } from '@/types';

export function useSetLists() {
  const { 
    user, 
    setLists, 
    setSetLists, 
    addSetList, 
    updateSetList, 
    deleteSetList,
    currentSetList,
    setCurrentSetList,
  } = useStore();
  const supabase = createClient();

  const fetchSetLists = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('set_lists')
      .select(`
        *,
        jokes:set_list_jokes(
          *,
          joke:jokes(*)
        ),
        notes:set_notes(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching set lists:', error);
      return;
    }

    // Transform the data to match our types
    const transformedData = data.map((setList: any) => ({
      ...setList,
      jokes: setList.jokes?.sort((a: SetListJoke, b: SetListJoke) => 
        a.order_position - b.order_position
      ),
      notes: setList.notes?.[0] || null,
    }));

    setSetLists(transformedData as SetList[]);
  }, [user, supabase, setSetLists]);

  useEffect(() => {
    fetchSetLists();
  }, [fetchSetLists]);

  const createSetList = async (name: string, description?: string) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('set_lists')
      .insert({
        user_id: user.id,
        name,
        description,
      })
      .select()
      .single();

    if (error) throw error;

    const newSetList = { ...data, jokes: [], notes: null } as SetList;
    addSetList(newSetList);
    return newSetList;
  };

  const editSetList = async (id: string, updates: Partial<SetList>) => {
    const { error } = await supabase
      .from('set_lists')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    updateSetList(id, updates);
  };

  const removeSetList = async (id: string) => {
    const { error } = await supabase
      .from('set_lists')
      .delete()
      .eq('id', id);

    if (error) throw error;

    deleteSetList(id);
  };

  const addJokeToSetList = async (setListId: string, jokeId: string) => {
    // Get current max position
    const setList = setLists.find(s => s.id === setListId);
    const maxPosition = setList?.jokes?.reduce((max, j) => 
      Math.max(max, j.order_position), -1) ?? -1;

    const { data, error } = await supabase
      .from('set_list_jokes')
      .insert({
        set_list_id: setListId,
        joke_id: jokeId,
        order_position: maxPosition + 1,
      })
      .select(`
        *,
        joke:jokes(*)
      `)
      .single();

    if (error) throw error;

    await fetchSetLists(); // Refresh to get updated data
    return data;
  };

  const removeJokeFromSetList = async (setListId: string, setListJokeId: string) => {
    const { error } = await supabase
      .from('set_list_jokes')
      .delete()
      .eq('id', setListJokeId);

    if (error) throw error;

    await fetchSetLists();
  };

  const reorderJokes = async (setListId: string, jokeIds: string[]) => {
    // Update positions for all jokes
    const updates = jokeIds.map((jokeId, index) => 
      supabase
        .from('set_list_jokes')
        .update({ order_position: index })
        .eq('set_list_id', setListId)
        .eq('joke_id', jokeId)
    );

    await Promise.all(updates);
    await fetchSetLists();
  };

  const saveSetNotes = async (setListId: string, aiNotes: any, userEdits?: string) => {
    // Check if notes exist
    const { data: existing } = await supabase
      .from('set_notes')
      .select('id')
      .eq('set_list_id', setListId)
      .single();

    if (existing) {
      await supabase
        .from('set_notes')
        .update({ ai_notes: aiNotes, user_edits: userEdits })
        .eq('set_list_id', setListId);
    } else {
      await supabase
        .from('set_notes')
        .insert({
          set_list_id: setListId,
          ai_notes: aiNotes,
          user_edits: userEdits,
        });
    }

    await fetchSetLists();
  };

  return {
    setLists,
    currentSetList,
    setCurrentSetList,
    fetchSetLists,
    createSetList,
    editSetList,
    removeSetList,
    addJokeToSetList,
    removeJokeFromSetList,
    reorderJokes,
    saveSetNotes,
  };
}
