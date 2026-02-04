import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateSuggestedSet } from '@/lib/openai';
import { getTierLimits } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription
    const { data: user } = await supabase
      .from('users')
      .select('subscription_tier, favorite_comedians')
      .eq('id', session.user.id)
      .single();

    const limits = getTierLimits(user?.subscription_tier || 'free');
    if (!limits.can_generate_sets) {
      return NextResponse.json(
        { error: 'Upgrade to Pro to generate sets' },
        { status: 403 }
      );
    }

    const { targetDuration } = await request.json() as {
      targetDuration: 5 | 10 | 15;
    };

    // Get user's jokes
    const { data: jokes } = await supabase
      .from('jokes')
      .select('*')
      .eq('user_id', session.user.id)
      .not('score', 'is', null)
      .order('score', { ascending: false });

    if (!jokes || jokes.length === 0) {
      return NextResponse.json(
        { error: 'No graded jokes available' },
        { status: 400 }
      );
    }

    // Generate suggested set
    const result = await generateSuggestedSet(
      jokes,
      targetDuration,
      user?.favorite_comedians || []
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating set:', error);
    return NextResponse.json(
      { error: 'Failed to generate set' },
      { status: 500 }
    );
  }
}
