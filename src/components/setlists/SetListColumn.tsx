'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableJokeItem } from './SortableJokeItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDuration, formatDate } from '@/lib/utils';
import type { SetList } from '@/types';
import {
  Trash2,
  Sparkles,
  FileText,
  Download,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SetListColumnProps {
  setList: SetList;
  onDelete: (id: string) => void;
  onRemoveJoke: (setListId: string, setListJokeId: string) => void;
  onGenerateNotes: () => void;
  onGenerateSet: () => void;
  onExport: (format: 'text' | 'pdf') => void;
  canGenerateNotes: boolean;
  canGenerateSet: boolean;
}

export function SetListColumn({
  setList,
  onDelete,
  onRemoveJoke,
  onGenerateNotes,
  onGenerateSet,
  onExport,
  canGenerateNotes,
  canGenerateSet,
}: SetListColumnProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `setlist-${setList.id}`,
  });

  const totalDuration = setList.jokes?.reduce(
    (sum, slj) => sum + (slj.joke?.duration_seconds || 30),
    0
  ) || 0;

  const jokeIds = setList.jokes?.map((j) => j.joke_id) || [];

  const handleGenerateNotes = async () => {
    setIsGeneratingNotes(true);
    try {
      await onGenerateNotes();
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={`rounded-xl bg-card border border-border p-6 transition-all ${
          isOver ? 'ring-2 ring-primary border-primary' : ''
        }`}
      >
        {/* Header */}
        <div className="mb-4 pb-3 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{setList.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="primary">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(totalDuration)}
                </Badge>
                <Badge>
                  {setList.jokes?.length || 0} jokes
                </Badge>
                {setList.last_performed && (
                  <Badge variant="secondary">
                    <Calendar className="w-3 h-3 mr-1" />
                    Last: {formatDate(setList.last_performed)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport('text')}
                title="Export as text"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-muted hover:text-error"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {setList.venue_notes && (
            <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-card-hover">
              <MapPin className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted">{setList.venue_notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* AI Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerateSet}
              disabled={!canGenerateSet}
              icon={<Sparkles className="w-4 h-4" />}
              className="flex-1"
            >
              Generate Set
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateNotes}
              disabled={!canGenerateNotes || !setList.jokes?.length}
              loading={isGeneratingNotes}
              icon={<FileText className="w-4 h-4" />}
              className="flex-1"
            >
              Get Notes
            </Button>
          </div>

          {/* Jokes List */}
          {setList.jokes && setList.jokes.length > 0 ? (
            <SortableContext
              items={jokeIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 min-h-[100px]">
                {setList.jokes.map((setListJoke, index) => (
                  <SortableJokeItem
                    key={setListJoke.id}
                    setListJoke={setListJoke}
                    index={index}
                    onRemove={() => onRemoveJoke(setList.id, setListJoke.id)}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            <div className="min-h-[100px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted">
                Drag jokes here to build your set
              </p>
            </div>
          )}

          {/* Performance Notes */}
          {setList.notes && (
            <div className="border-t border-border pt-4">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full"
              >
                <FileText className="w-4 h-4" />
                Performance Notes
                {showNotes ? (
                  <ChevronUp className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                )}
              </button>

              {showNotes && (
                <div className="mt-4 space-y-4 text-sm">
                  {/* Opening Suggestions */}
                  {setList.notes.ai_notes.opening_suggestions?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-primary mb-2">Opening Ideas</h4>
                      <ul className="space-y-1">
                        {setList.notes.ai_notes.opening_suggestions.map((s: string, i: number) => (
                          <li key={i} className="text-muted pl-4 border-l-2 border-primary/30">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Stage Directions */}
                  {setList.notes.ai_notes.stage_directions?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-secondary mb-2">Stage Directions</h4>
                      <ul className="space-y-1">
                        {setList.notes.ai_notes.stage_directions.map((sd: { joke_index: number; direction: string }, i: number) => (
                          <li key={i} className="text-muted pl-4 border-l-2 border-secondary/30">
                            <span className="font-medium">Joke {sd.joke_index}:</span> {sd.direction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Callback Opportunities */}
                  {setList.notes.ai_notes.callback_opportunities?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-warning mb-2">Callback Opportunities</h4>
                      <ul className="space-y-1">
                        {setList.notes.ai_notes.callback_opportunities.map((cb: { from_joke_index: number; to_joke_index: number; suggestion: string }, i: number) => (
                          <li key={i} className="text-muted pl-4 border-l-2 border-warning/30">
                            Jokes {cb.from_joke_index} → {cb.to_joke_index}: {cb.suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recovery Lines */}
                  {setList.notes.ai_notes.audience_recovery_lines?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-error mb-2">If a Joke Bombs...</h4>
                      <ul className="space-y-1">
                        {setList.notes.ai_notes.audience_recovery_lines.map((line: string, i: number) => (
                          <li key={i} className="text-muted pl-4 border-l-2 border-error/30">
                            "{line}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Closing Suggestions */}
                  {setList.notes.ai_notes.closing_suggestions?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-success mb-2">Strong Closers</h4>
                      <ul className="space-y-1">
                        {setList.notes.ai_notes.closing_suggestions.map((s: string, i: number) => (
                          <li key={i} className="text-muted pl-4 border-l-2 border-success/30">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* General Notes */}
                  {setList.notes.ai_notes.general_notes && (
                    <div>
                      <h4 className="font-medium mb-2">General Notes</h4>
                      <p className="text-muted">{setList.notes.ai_notes.general_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Set List"
        size="sm"
      >
        <p className="text-muted mb-6">
          Are you sure you want to delete "{setList.name}"? This won't delete the jokes themselves.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onDelete(setList.id);
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
