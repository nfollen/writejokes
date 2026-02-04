import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UserStats, JokeStyle, JokeCategory, Joke } from '@/types';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user's jokes
    const { data: jokes } = await supabase
      .from('jokes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (!jokes || jokes.length === 0) {
      const emptyStats: UserStats = {
        total_jokes: 0,
        avg_score: 0,
        jokes_by_style: {} as Record<JokeStyle, number>,
        jokes_by_category: {} as Record<JokeCategory, number>,
        score_over_time: [],
        favorite_style: null,
        improvement_trajectory: 0,
      };
      return NextResponse.json(emptyStats);
    }

    const typedJokes = jokes as Joke[];

    // Calculate stats
    const total_jokes = typedJokes.length;
    
    const scoredJokes = typedJokes.filter((j) => j.score !== null);
    const avg_score = scoredJokes.length > 0
      ? scoredJokes.reduce((sum, j) => sum + (j.score || 0), 0) / scoredJokes.length
      : 0;

    // Group by style
    const jokes_by_style = typedJokes.reduce((acc, joke) => {
      acc[joke.style as JokeStyle] = (acc[joke.style as JokeStyle] || 0) + 1;
      return acc;
    }, {} as Record<JokeStyle, number>);

    // Group by category
    const jokes_by_category = typedJokes.reduce((acc, joke) => {
      if (joke.category) {
        acc[joke.category as JokeCategory] = (acc[joke.category as JokeCategory] || 0) + 1;
      }
      return acc;
    }, {} as Record<JokeCategory, number>);

    // Find favorite style
    const favorite_style = Object.entries(jokes_by_style)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] as JokeStyle | null;

    // Calculate score over time (group by day)
    const scoresByDate = scoredJokes.reduce((acc, joke) => {
      const date = joke.created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, count: 0 };
      }
      acc[date].total += joke.score || 0;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const score_over_time = Object.entries(scoresByDate)
      .map(([date, data]) => ({
        date,
        avg_score: Math.round((data.total / data.count) * 10) / 10,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate improvement trajectory
    // Compare average of last 5 jokes to first 5 jokes
    let improvement_trajectory = 0;
    if (scoredJokes.length >= 10) {
      const first5Avg = scoredJokes.slice(0, 5).reduce((s, j) => s + (j.score || 0), 0) / 5;
      const last5Avg = scoredJokes.slice(-5).reduce((s, j) => s + (j.score || 0), 0) / 5;
      improvement_trajectory = Math.round((last5Avg - first5Avg) * 10) / 10;
    }

    const stats: UserStats = {
      total_jokes,
      avg_score: Math.round(avg_score * 10) / 10,
      jokes_by_style,
      jokes_by_category,
      score_over_time,
      favorite_style,
      improvement_trajectory,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
