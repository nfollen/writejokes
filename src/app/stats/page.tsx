'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { JOKE_STYLES, JOKE_CATEGORIES, type UserStats } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award, Target, Flame } from 'lucide-react';

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-5 h-5 text-success" />;
    if (value < 0) return <TrendingDown className="w-5 h-5 text-error" />;
    return <Minus className="w-5 h-5 text-muted" />;
  };

  const styleColors = {
    standup: '#f97316',
    'one-liner': '#6366f1',
    observational: '#22c55e',
    'dark-humor': '#ef4444',
    puns: '#eab308',
    storytelling: '#8b5cf6',
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8 pt-24 md:pt-20">
            <div className="mb-8">
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <div className="grid gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (!stats || stats.total_jokes === 0) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8 pt-24 md:pt-20">
            <div className="text-center py-20">
              <Target className="w-16 h-16 text-muted mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Stats Yet</h2>
              <p className="text-muted">Write some jokes to see your statistics!</p>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  const styleData = Object.entries(stats.jokes_by_style).map(([style, count]) => ({
    name: JOKE_STYLES.find((s) => s.value === style)?.label || style,
    value: count,
    fill: styleColors[style as keyof typeof styleColors] || '#737373',
  }));

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 py-8 pt-24 md:pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Comedy Stats</h1>
            <p className="text-muted">Track your progress and see where you shine.</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted mb-1">Total Jokes</p>
                <p className="text-4xl font-bold text-primary">{stats.total_jokes}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted mb-1">Average Score</p>
                <p className="text-4xl font-bold text-secondary">{stats.avg_score}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted mb-1">Improvement</p>
                <div className="flex items-center justify-center gap-2">
                  <p className={`text-4xl font-bold ${
                    stats.improvement_trajectory >= 0 ? 'text-success' : 'text-error'
                  }`}>
                    {stats.improvement_trajectory >= 0 ? '+' : ''}
                    {stats.improvement_trajectory}
                  </p>
                  {getTrendIcon(stats.improvement_trajectory)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted mb-1">Top Style</p>
                <div className="flex items-center justify-center gap-2">
                  <Award className="w-6 h-6 text-warning" />
                  <p className="text-lg font-bold capitalize">
                    {stats.favorite_style?.replace('-', ' ') || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Score Over Time */}
            {stats.score_over_time.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Score Progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.score_over_time}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#737373', fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          domain={[0, 10]} 
                          tick={{ fill: '#737373', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#141414',
                            border: '1px solid #262626',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#737373' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="avg_score"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={{ fill: '#f97316' }}
                          name="Avg Score"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Jokes by Style */}
            {styleData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Jokes by Style</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={styleData} layout="vertical">
                        <XAxis type="number" tick={{ fill: '#737373', fontSize: 12 }} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          tick={{ fill: '#737373', fontSize: 12 }}
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#141414',
                            border: '1px solid #262626',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#737373' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {styleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Categories Breakdown */}
          {Object.keys(stats.jokes_by_category).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats.jokes_by_category).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card-hover"
                    >
                      <span className="font-medium capitalize">
                        {category.replace('-', ' ')}
                      </span>
                      <Badge variant="primary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Milestones */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { target: 10, label: 'First 10 Jokes', icon: '🎯' },
                  { target: 50, label: '50 Jokes', icon: '🔥' },
                  { target: 100, label: '100 Club', icon: '💯' },
                  { target: 500, label: 'Comedy Master', icon: '🏆' },
                ].map((milestone) => {
                  const achieved = stats.total_jokes >= milestone.target;
                  return (
                    <div
                      key={milestone.target}
                      className={`p-4 rounded-lg border text-center ${
                        achieved
                          ? 'bg-success/10 border-success/30'
                          : 'bg-card border-border opacity-50'
                      }`}
                    >
                      <span className="text-2xl">{milestone.icon}</span>
                      <p className="font-medium mt-2">{milestone.label}</p>
                      <p className="text-xs text-muted">
                        {achieved ? 'Achieved!' : `${stats.total_jokes}/${milestone.target}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
}
