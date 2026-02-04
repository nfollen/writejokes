import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateSetNotes } from '@/lib/openai';
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
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single();

    const limits = getTierLimits(user?.subscription_tier || 'free');
    if (!limits.can_generate_notes) {
      return NextResponse.json(
        { error: 'Upgrade to Pro to generate notes' },
        { status: 403 }
      );
    }

    const { setListId } = await request.json() as { setListId: string };

    // Get set list with jokes
    const { data: setList } = await supabase
      .from('set_lists')
      .select(`
        *,
        jokes:set_list_jokes(
          order_position,
          joke:jokes(*)
        )
      `)
      .eq('id', setListId)
      .eq('user_id', session.user.id)
      .single();

    if (!setList) {
      return NextResponse.json(
        { error: 'Set list not found' },
        { status: 404 }
      );
    }

    // Sort jokes by position and extract joke data
    const orderedJokes = setList.jokes
      .sort((a: any, b: any) => a.order_position - b.order_position)
      .map((slj: any) => slj.joke);

    if (orderedJokes.length === 0) {
      return NextResponse.json(
        { error: 'Set list has no jokes' },
        { status: 400 }
      );
    }

    // Generate notes
    const notes = await generateSetNotes(orderedJokes, setList.name);

    // Save notes to database
    const { data: existing } = await supabase
      .from('set_notes')
      .select('id')
      .eq('set_list_id', setListId)
      .single();

    if (existing) {
      await supabase
        .from('set_notes')
        .update({ ai_notes: notes })
        .eq('set_list_id', setListId);
    } else {
      await supabase
        .from('set_notes')
        .insert({
          set_list_id: setListId,
          ai_notes: notes,
        });
    }

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error generating notes:', error);
    return NextResponse.json(
      { error: 'Failed to generate notes' },
      { status: 500 }
    );
  }
}
