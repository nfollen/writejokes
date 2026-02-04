'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRelativeTime, getScoreColor, getScoreBgColor, truncate, formatDuration } from '@/lib/utils';
import { JOKE_STYLES, type Joke } from '@/types';
import { Trash2, Clock, Tag, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

interface JokeCardProps {
  joke: Joke;
  onDelete?: (id: string) => void;
  onDurationChange?: (id: string, duration: number) => void;
  draggable?: boolean;
  showFullContent?: boolean;
}

export function JokeCard({ joke, onDelete, onDurationChange, draggable, showFullContent = false }: JokeCardProps) {
  const [isExpanded, setIsExpanded] = useState(showFullContent);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const styleLabel = JOKE_STYLES.find((s) => s.value === joke.style)?.label || joke.style;

  return (
    <>
      <Card variant="interactive" className="group">
        <CardContent>
          <div className="flex items-start gap-3">
            {draggable && (
              <div className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-muted opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {joke.score && (
                    <div
                      className={`px-2.5 py-1 rounded-full text-sm font-bold ${getScoreColor(joke.score)} ${getScoreBgColor(joke.score)}`}
                    >
                      {joke.score}/10
                    </div>
                  )}
                  <Badge variant={joke.is_freeform ? 'secondary' : 'primary'}>
                    {joke.is_freeform ? 'Freeform' : 'Prompt'}
                  </Badge>
                  <Badge>{styleLabel}</Badge>
                </div>
                <span className="text-xs text-muted whitespace-nowrap">
                  {formatRelativeTime(joke.created_at)}
                </span>
              </div>

              {/* Prompt (if exists) */}
              {joke.prompt && (
                <p className="text-sm text-muted mb-2 italic">
                  Prompt: {truncate(joke.prompt, 100)}
                </p>
              )}

              {/* Joke Text */}
              <p className="text-foreground whitespace-pre-wrap">
                {isExpanded ? joke.joke_text : truncate(joke.joke_text, 200)}
              </p>

              {joke.joke_text.length > 200 && !showFullContent && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" /> Show more
                    </>
                  )}
                </button>
              )}

              {/* Tags */}
              {joke.custom_tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-3">
                  <Tag className="w-3 h-3 text-muted" />
                  {joke.custom_tags.map((tag) => (
                    <Badge key={tag} size="sm" variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tips (collapsible) */}
              {joke.tips.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showTips ? 'Hide tips' : `View ${joke.tips.length} improvement tips`}
                  </button>
                  
                  {showTips && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 space-y-1 pl-4"
                    >
                      {joke.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-muted list-disc list-inside">
                          {tip}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t-0 pt-0">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="w-4 h-4" />
            {onDurationChange ? (
              <input
                type="number"
                value={joke.duration_seconds}
                onChange={(e) => onDurationChange(joke.id, Number(e.target.value))}
                className="w-16 px-2 py-0.5 rounded bg-card-hover border border-border text-foreground text-sm"
                min={5}
                max={600}
              />
            ) : (
              <span>{formatDuration(joke.duration_seconds)}</span>
            )}
          </div>

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-muted hover:text-error"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Joke"
        size="sm"
      >
        <p className="text-muted mb-6">
          Are you sure you want to delete this joke? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onDelete?.(joke.id);
              setShowDeleteConfirm(false);
            }}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
