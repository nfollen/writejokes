import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateJokePrompt } from '@/lib/openai';
import type { JokeStyle, JokeCategory } from '@/types';

export async function POST(request: Request) {
  console.log('[API] /api/prompts/generate called');
  
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log('[API] Session check:', { hasSession: !!session, sessionError });

    if (!session) {
      console.log('[API] No session - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, style } = body as {
      category: JokeCategory;
      style: JokeStyle;
    };
    
    console.log('[API] Request body:', { category, style });

    // Get user preferences
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('favorite_comedians')
      .eq('id', session.user.id)
      .single();

    console.log('[API] User fetch:', { user, userError });

    // Get previously used prompts to avoid repetition
    const { data: history } = await supabase
      .from('prompt_history')
      .select('prompt_hash')
      .eq('user_id', session.user.id)
      .order('used_at', { ascending: false })
      .limit(50);

    const usedHashes = history?.map((h: { prompt_hash: string }) => h.prompt_hash) || [];

    console.log('[API] Calling generateJokePrompt...');
    
    // Generate new prompt
    const prompt = await generateJokePrompt(
      category,
      style,
      user?.favorite_comedians || [],
      usedHashes
    );

    console.log('[API] Prompt generated successfully:', prompt);

    return NextResponse.json(prompt);
  } catch (error: any) {
    console.error('[API] Error generating prompt:', error?.message || error);
    console.error('[API] Full error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
