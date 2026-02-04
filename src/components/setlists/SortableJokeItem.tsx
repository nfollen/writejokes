'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/Badge';
import { truncate, getScoreColor, formatDuration } from '@/lib/utils';
import type { SetListJoke } from '@/types';
import { GripVertical, X, Clock } from 'lucide-react';

interface SortableJokeItemProps {
  setListJoke: SetListJoke;
  index: number;
  onRemove: () => void;
}

export function SortableJokeItem({ setListJoke, index, onRemove }: SortableJokeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setListJoke.joke_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const joke = setListJoke.joke;
  if (!joke) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2 p-3 rounded-lg bg-card-hover border border-border hover:border-primary/30 transition-all ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-border transition-colors"
      >
        <GripVertical className="w-4 h-4 text-muted" />
      </button>

      {/* Index Number */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-2">
          {truncate(joke.joke_text, 120)}
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

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded hover:bg-error/20 text-muted hover:text-error transition-all opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
