import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { gradeJoke } from '@/lib/openai';
import type { JokeStyle } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jokeText, prompt, style } = await request.json() as {
      jokeText: string;
      prompt: string | null;
      style: JokeStyle;
    };

    if (!jokeText?.trim()) {
      return NextResponse.json(
        { error: 'Joke text is required' },
        { status: 400 }
      );
    }

    // Get user preferences for personalized grading
    const { data: user } = await supabase
      .from('users')
      .select('favorite_comedians')
      .eq('id', session.user.id)
      .single();

    // Grade the joke
    const grade = await gradeJoke(
      jokeText,
      prompt,
      style,
      user?.favorite_comedians || []
    );

    return NextResponse.json(grade);
  } catch (error) {
    console.error('Error grading joke:', error);
    return NextResponse.json(
      { error: 'Failed to grade joke' },
      { status: 500 }
    );
  }
}
