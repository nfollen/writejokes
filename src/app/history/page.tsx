'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { JokeCard } from '@/components/jokes/JokeCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useJokes } from '@/hooks/useJokes';
import { JOKE_STYLES, JOKE_CATEGORIES, type JokeStyle, type JokeCategory } from '@/types';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export default function HistoryPage() {
  const { jokes, fetchJokes, removeJoke } = useJokes();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState<JokeStyle | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<JokeCategory | 'all'>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadJokes = async () => {
      await fetchJokes();
      setIsLoading(false);
    };
    loadJokes();
  }, [fetchJokes]);

  const filteredJokes = jokes.filter((joke) => {
    const matchesSearch = search
      ? joke.joke_text.toLowerCase().includes(search.toLowerCase()) ||
        joke.prompt?.toLowerCase().includes(search.toLowerCase())
      : true;
    
    const matchesStyle = styleFilter === 'all' || joke.style === styleFilter;
    const matchesCategory = categoryFilter === 'all' || joke.category === categoryFilter;
    
    let matchesScore = true;
    if (scoreFilter !== 'all' && joke.score) {
      const minScore = parseInt(scoreFilter);
      matchesScore = joke.score >= minScore;
    }

    return matchesSearch && matchesStyle && matchesCategory && matchesScore;
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 py-8 pt-24 md:pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Joke History</h1>
            <p className="text-muted">
              Browse and filter all your jokes. Click on one to see details.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <Input
                  placeholder="Search jokes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                icon={<SlidersHorizontal className="w-5 h-5" />}
              >
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-card border border-border">
                <Select
                  label="Style"
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value as JokeStyle | 'all')}
                  options={[
                    { value: 'all', label: 'All Styles' },
                    ...JOKE_STYLES.map((s) => ({ value: s.value, label: s.label })),
                  ]}
                />
                <Select
                  label="Category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as JokeCategory | 'all')}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...JOKE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
                  ]}
                />
                <Select
                  label="Minimum Score"
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Any Score' },
                    { value: '8', label: '8+ (Great)' },
                    { value: '6', label: '6+ (Good)' },
                    { value: '4', label: '4+ (Okay)' },
                  ]}
                />
              </div>
            )}
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted mb-4">
            Showing {filteredJokes.length} of {jokes.length} jokes
          </p>

          {/* Jokes List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredJokes.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jokes found</h3>
              <p className="text-muted">
                {jokes.length === 0
                  ? "You haven't written any jokes yet. Start writing!"
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJokes.map((joke) => (
                <JokeCard
                  key={joke.id}
                  joke={joke}
                  onDelete={removeJoke}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
