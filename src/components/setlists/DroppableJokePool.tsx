'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { truncate, getScoreColor, formatDuration } from '@/lib/utils';
import { JOKE_STYLES, type Joke, type JokeStyle } from '@/types';
import { Search, GripVertical, Clock } from 'lucide-react';

interface DroppableJokePoolProps {
  jokes: Joke[];
}

function DraggableJoke({ joke }: { joke: Joke }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: joke.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group flex items-start gap-2 p-3 rounded-lg bg-card border border-border hover:border-primary/30 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <GripVertical className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-2">
          {truncate(joke.joke_text, 80)}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {joke.score && (
            <span className={`text-xs font-bold ${getScoreColor(joke.score)}`}>
              {joke.score}/10
            </span>
          )}
          <Badge size="sm">{joke.style}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock className="w-3 h-3" />
            {formatDuration(joke.duration_seconds)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DroppableJokePool({ jokes }: DroppableJokePoolProps) {
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState<JokeStyle | 'all'>('all');
  const [minScore, setMinScore] = useState<number>(0);

  const filteredJokes = jokes.filter((joke) => {
    const matchesSearch = joke.joke_text.toLowerCase().includes(search.toLowerCase());
    const matchesStyle = styleFilter === 'all' || joke.style === styleFilter;
    const matchesScore = !joke.score || joke.score >= minScore;
    return matchesSearch && matchesStyle && matchesScore;
  });

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Available Jokes
          <Badge variant="secondary">{jokes.length}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              placeholder="Search jokes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value as JokeStyle | 'all')}
              options={[
                { value: 'all', label: 'All Styles' },
                ...JOKE_STYLES.map((s) => ({ value: s.value, label: s.label })),
              ]}
            />
            <Select
              value={String(minScore)}
              onChange={(e) => setMinScore(Number(e.target.value))}
              options={[
                { value: '0', label: 'Any Score' },
                { value: '6', label: '6+ Score' },
                { value: '7', label: '7+ Score' },
                { value: '8', label: '8+ Score' },
              ]}
            />
          </div>
        </div>

        {/* Jokes List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredJokes.length === 0 ? (
            <div className="text-center py-8 text-muted">
              {jokes.length === 0
                ? 'No jokes available. Write some first!'
                : 'No jokes match your filters.'}
            </div>
          ) : (
            filteredJokes.map((joke) => (
              <DraggableJoke key={joke.id} joke={joke} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
