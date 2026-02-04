'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useJokes } from '@/hooks/useJokes';
import { useSetLists } from '@/hooks/useSetLists';
import { useStore } from '@/lib/store';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { OnboardingModal } from '@/components/jokes/OnboardingModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { canWriteJoke, formatRelativeTime, getScoreColor } from '@/lib/utils';
import type { UserStats } from '@/types';
import { 
  PenLine, 
  History, 
  ListMusic, 
  BarChart3, 
  TrendingUp, 
  Award,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';

function DashboardContent() {
  const { user } = useUser();
  const { jokes } = useJokes();
  const { setLists } = useSetLists();
  const { showOnboarding, setShowOnboarding } = useStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const searchParams = useSearchParams();

  const showSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    };
    fetchStats();
  }, []);

  if (!user) return null;

  const { remaining } = canWriteJoke(user);
  const recentJokes = jokes.slice(0, 3);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8 pt-24 md:pt-20">
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/30 flex items-center gap-3">
              <Check className="w-5 h-5 text-success" />
              <p className="text-success font-medium">
                Welcome to Pro! You now have unlimited access.
              </p>
            </div>
          )}

          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back{user.display_name ? `, ${user.display_name.split(' ')[0]}` : ''}! 🎤
            </h1>
            <p className="text-muted">
              {remaining === Infinity
                ? 'You have unlimited jokes with Pro.'
                : `You have ${remaining} jokes remaining this month.`}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="/write">
              <Card variant="interactive" className="h-full">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <PenLine className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-medium">Write a Joke</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/history">
              <Card variant="interactive" className="h-full">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
                    <History className="w-6 h-6 text-secondary" />
                  </div>
                  <span className="font-medium">View History</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/setlists">
              <Card variant="interactive" className="h-full">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                    <ListMusic className="w-6 h-6 text-success" />
                  </div>
                  <span className="font-medium">Set Lists</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/stats">
              <Card variant="interactive" className="h-full">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
                    <BarChart3 className="w-6 h-6 text-warning" />
                  </div>
                  <span className="font-medium">Your Stats</span>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Stats Overview */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-card-hover">
                      <p className="text-sm text-muted mb-1">Total Jokes</p>
                      <p className="text-2xl font-bold">{stats?.total_jokes || 0}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card-hover">
                      <p className="text-sm text-muted mb-1">Avg Score</p>
                      <p className="text-2xl font-bold">{stats?.avg_score?.toFixed(1) || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card-hover">
                      <p className="text-sm text-muted mb-1">Set Lists</p>
                      <p className="text-2xl font-bold">{setLists.length}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card-hover">
                      <p className="text-sm text-muted mb-1">Improvement</p>
                      <p className={`text-2xl font-bold flex items-center gap-1 ${
                        (stats?.improvement_trajectory || 0) >= 0 ? 'text-success' : 'text-error'
                      }`}>
                        {(stats?.improvement_trajectory || 0) >= 0 ? '+' : ''}
                        {stats?.improvement_trajectory || 0}
                        <TrendingUp className="w-4 h-4" />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Jokes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Jokes</CardTitle>
                  <Link href="/history">
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentJokes.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 text-muted mx-auto mb-4" />
                      <p className="text-muted mb-4">No jokes yet. Write your first one!</p>
                      <Link href="/write">
                        <Button>Start Writing</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentJokes.map((joke) => (
                        <div
                          key={joke.id}
                          className="p-4 rounded-lg bg-card-hover border border-border"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm line-clamp-2 flex-1">{joke.joke_text}</p>
                            {joke.score && (
                              <span className={`font-bold ${getScoreColor(joke.score)}`}>
                                {joke.score}/10
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge size="sm">{joke.style}</Badge>
                            <span className="text-xs text-muted">
                              {formatRelativeTime(joke.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Favorite Style */}
              {stats?.favorite_style && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-warning" />
                      Your Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold capitalize mb-1">
                      {stats.favorite_style.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-muted">
                      This is your most practiced joke style
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Pro Upsell (if free) */}
              {user.subscription_tier === 'free' && (
                <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
                  <CardContent className="py-6">
                    <h3 className="font-bold mb-2">Upgrade to Pro</h3>
                    <p className="text-sm text-muted mb-4">
                      Get unlimited jokes, AI set generation, and performance notes.
                    </p>
                    <Link href="/settings">
                      <Button className="w-full">
                        Upgrade for $10/mo
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Set Lists */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Set Lists</CardTitle>
                  <Link href="/setlists">
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {setLists.length === 0 ? (
                    <p className="text-sm text-muted">No set lists yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {setLists.slice(0, 3).map((setList) => (
                        <Link
                          key={setList.id}
                          href="/setlists"
                          className="block p-3 rounded-lg bg-card-hover hover:border-primary/30 border border-transparent transition-all"
                        >
                          <p className="font-medium text-sm">{setList.name}</p>
                          <p className="text-xs text-muted">
                            {setList.jokes?.length || 0} jokes
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Onboarding Modal */}
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      </div>
    </AuthGuard>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DashboardContent />
    </Suspense>
  );
}
