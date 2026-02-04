import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateJokePrompt } from '@/lib/openai';
import type { JokeStyle, JokeCategory } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, style } = await request.json() as {
      category: JokeCategory;
      style: JokeStyle;
    };

    // Get user preferences
    const { data: user } = await supabase
      .from('users')
      .select('favorite_comedians')
      .eq('id', session.user.id)
      .single();

    // Get previously used prompts to avoid repetition
    const { data: history } = await supabase
      .from('prompt_history')
      .select('prompt_hash')
      .eq('user_id', session.user.id)
      .order('used_at', { ascending: false })
      .limit(50);

    const usedHashes = history?.map((h: { prompt_hash: string }) => h.prompt_hash) || [];

    // Generate new prompt
    const prompt = await generateJokePrompt(
      category,
      style,
      user?.favorite_comedians || [],
      usedHashes
    );

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
