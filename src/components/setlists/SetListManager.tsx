'use client';

import { useState, useEffect } from 'react';
import { useSetLists } from '@/hooks/useSetLists';
import { useJokes } from '@/hooks/useJokes';
import { useUser } from '@/hooks/useUser';
import { useStore } from '@/lib/store';
import { JokeCard } from '@/components/jokes/JokeCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { canCreateSetList, formatDuration, getTierLimits, generateExportText, truncate, getScoreColor } from '@/lib/utils';
import { JOKE_STYLES, type Joke, type SetList, type JokeStyle } from '@/types';
import { Plus, Sparkles, FileText, Download, Search, Clock, Trash2, ArrowUp, ArrowDown, Calendar, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';

export function SetListManager() {
  const { user } = useUser();
  const { jokes } = useJokes();
  const {
    setLists,
    createSetList,
    editSetList,
    removeSetList,
    addJokeToSetList,
    removeJokeFromSetList,
    reorderJokes,
    saveSetNotes,
  } = useSetLists();
  const { setShowUpgradeModal } = useStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetListName, setNewSetListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingDuration, setGeneratingDuration] = useState<5 | 10 | 15>(5);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [targetSetList, setTargetSetList] = useState<SetList | null>(null);
  
  // For adding jokes to sets
  const [addingToSetList, setAddingToSetList] = useState<SetList | null>(null);
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState<JokeStyle | 'all'>('all');

  if (!user) return null;

  const limits = getTierLimits(user.subscription_tier);
  const canCreate = canCreateSetList(user, setLists.length);

  // Get jokes not in any set list
  const jokesInSets = new Set(
    setLists.flatMap((s) => s.jokes?.map((j) => j.joke_id) || [])
  );
  const availableJokes = jokes.filter((j) => !jokesInSets.has(j.id));

  // Filter available jokes for add modal
  const filteredJokes = availableJokes.filter((joke) => {
    const matchesSearch = joke.joke_text.toLowerCase().includes(search.toLowerCase());
    const matchesStyle = styleFilter === 'all' || joke.style === styleFilter;
    return matchesSearch && matchesStyle;
  });

  const handleCreateSetList = async () => {
    if (!newSetListName.trim()) return;

    if (!canCreate) {
      setShowUpgradeModal(true);
      return;
    }

    setIsCreating(true);
    try {
      await createSetList(newSetListName.trim());
      setNewSetListName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating set list:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddJokeToSet = async (jokeId: string) => {
    if (!addingToSetList) return;
    await addJokeToSetList(addingToSetList.id, jokeId);
  };

  const handleMoveJoke = async (setList: SetList, jokeId: string, direction: 'up' | 'down') => {
    if (!setList.jokes) return;
    
    const currentOrder = setList.jokes.map((j) => j.joke_id);
    const currentIndex = currentOrder.indexOf(jokeId);
    
    if (direction === 'up' && currentIndex > 0) {
      const newOrder = [...currentOrder];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      await reorderJokes(setList.id, newOrder);
    } else if (direction === 'down' && currentIndex < currentOrder.length - 1) {
      const newOrder = [...currentOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      await reorderJokes(setList.id, newOrder);
    }
  };

  const handleGenerateSet = async () => {
    if (!targetSetList || !limits.can_generate_sets) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDuration: generatingDuration,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate set');

      const { jokeIds, reasoning } = await response.json();

      // Add jokes to set list in order
      for (const jokeId of jokeIds) {
        await addJokeToSetList(targetSetList.id, jokeId);
      }

      setShowGenerateModal(false);
      setTargetSetList(null);
    } catch (error) {
      console.error('Error generating set:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateNotes = async (setList: SetList) => {
    if (!limits.can_generate_notes) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      const response = await fetch('/api/ai/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setListId: setList.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate notes');

      const { notes } = await response.json();
      await saveSetNotes(setList.id, notes);
    } catch (error) {
      console.error('Error generating notes:', error);
    }
  };

  const handleExport = (setList: SetList, format: 'text' | 'pdf') => {
    const jokesWithText = setList.jokes?.map((slj) => ({
      joke_text: slj.joke?.joke_text || '',
      notes: slj.notes || undefined,
    })) || [];

    const content = generateExportText(setList.name, jokesWithText, setList.venue_notes || undefined);

    if (format === 'text') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${setList.name.replace(/\s+/g, '-')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Set Lists</h2>
          <p className="text-muted">
            Build and organize your sets. {!canCreate && '(Upgrade for unlimited)'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={!canCreate && user.subscription_tier === 'free'}
          icon={<Plus className="w-4 h-4" />}
        >
          New Set List
        </Button>
      </div>

      {/* Set Lists */}
      <div className="space-y-6">
        {setLists.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <p className="text-muted mb-4">No set lists yet. Create your first one!</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Set List
            </Button>
          </div>
        ) : (
          setLists.map((setList) => (
            <SetListCard
              key={setList.id}
              setList={setList}
              onDelete={removeSetList}
              onRemoveJoke={removeJokeFromSetList}
              onMoveJoke={(jokeId, dir) => handleMoveJoke(setList, jokeId, dir)}
              onAddJokes={() => setAddingToSetList(setList)}
              onGenerateNotes={() => handleGenerateNotes(setList)}
              onGenerateSet={() => {
                setTargetSetList(setList);
                setShowGenerateModal(true);
              }}
              onExport={(format) => handleExport(setList, format)}
              canGenerateNotes={limits.can_generate_notes}
              canGenerateSet={limits.can_generate_sets}
            />
          ))
        )}
      </div>

      {/* Create Set List Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Set List"
      >
        <div className="space-y-4">
          <Input
            label="Set List Name"
            placeholder='e.g., "Sunday Night Mic", "Tight 5"'
            value={newSetListName}
            onChange={(e) => setNewSetListName(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSetList}
              loading={isCreating}
              disabled={!newSetListName.trim()}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Jokes Modal */}
      <Modal
        isOpen={!!addingToSetList}
        onClose={() => {
          setAddingToSetList(null);
          setSearch('');
          setStyleFilter('all');
        }}
        title={`Add Jokes to "${addingToSetList?.name || ''}"`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search jokes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value as JokeStyle | 'all')}
              options={[
                { value: 'all', label: 'All Styles' },
                ...JOKE_STYLES.map((s) => ({ value: s.value, label: s.label })),
              ]}
            />
          </div>

          {/* Available Jokes */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredJokes.length === 0 ? (
              <div className="text-center py-8 text-muted">
                {availableJokes.length === 0
                  ? 'All jokes are already in set lists!'
                  : 'No jokes match your filters.'}
              </div>
            ) : (
              filteredJokes.map((joke) => (
                <div
                  key={joke.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">
                      {truncate(joke.joke_text, 100)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
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
                  <Button
                    size="sm"
                    onClick={() => handleAddJokeToSet(joke.id)}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setAddingToSetList(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate Set Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Suggested Set"
      >
        <div className="space-y-6">
          <p className="text-muted">
            AI will analyze your jokes and create an optimized set based on scores, 
            flow, and variety.
          </p>

          <div>
            <label className="block text-sm font-medium mb-3">Target Duration</label>
            <div className="flex gap-3">
              {([5, 10, 15] as const).map((mins) => (
                <button
                  key={mins}
                  onClick={() => setGeneratingDuration(mins)}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                    generatingDuration === mins
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateSet}
              loading={isGenerating}
              icon={<Sparkles className="w-4 h-4" />}
              className="flex-1"
            >
              Generate Set
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Simplified Set List Card Component
interface SetListCardProps {
  setList: SetList;
  onDelete: (id: string) => void;
  onRemoveJoke: (setListId: string, setListJokeId: string) => void;
  onMoveJoke: (jokeId: string, direction: 'up' | 'down') => void;
  onAddJokes: () => void;
  onGenerateNotes: () => void;
  onGenerateSet: () => void;
  onExport: (format: 'text' | 'pdf') => void;
  canGenerateNotes: boolean;
  canGenerateSet: boolean;
}

function SetListCard({
  setList,
  onDelete,
  onRemoveJoke,
  onMoveJoke,
  onAddJokes,
  onGenerateNotes,
  onGenerateSet,
  onExport,
  canGenerateNotes,
  canGenerateSet,
}: SetListCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  const totalDuration = setList.jokes?.reduce(
    (sum, slj) => sum + (slj.joke?.duration_seconds || 30),
    0
  ) || 0;

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
      <Card>
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{setList.name}</CardTitle>
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
                    Last: {new Date(setList.last_performed).toLocaleDateString()}
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
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={onAddJokes}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Jokes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerateSet}
              disabled={!canGenerateSet}
              icon={<Sparkles className="w-4 h-4" />}
            >
              AI Generate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateNotes}
              disabled={!canGenerateNotes || !setList.jokes?.length}
              loading={isGeneratingNotes}
              icon={<FileText className="w-4 h-4" />}
            >
              Get Notes
            </Button>
          </div>

          {/* Jokes List */}
          {setList.jokes && setList.jokes.length > 0 ? (
            <div className="space-y-2">
              {setList.jokes.map((setListJoke, index) => {
                const joke = setListJoke.joke;
                if (!joke) return null;
                
                return (
                  <div
                    key={setListJoke.id}
                    className="flex items-center gap-2 p-3 rounded-lg bg-card-hover border border-border"
                  >
                    {/* Order Number */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-1">
                        {truncate(joke.joke_text, 80)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
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

                    {/* Reorder Controls */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onMoveJoke(setListJoke.joke_id, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-border text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onMoveJoke(setListJoke.joke_id, 'down')}
                        disabled={index === setList.jokes!.length - 1}
                        className="p-1 rounded hover:bg-border text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveJoke(setList.id, setListJoke.id)}
                      className="flex-shrink-0 p-1.5 rounded hover:bg-error/20 text-muted hover:text-error transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted mb-3">No jokes yet</p>
              <Button size="sm" onClick={onAddJokes} icon={<Plus className="w-4 h-4" />}>
                Add Jokes
              </Button>
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
                  {setList.notes.ai_notes?.opening_suggestions?.length > 0 && (
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
                  {setList.notes.ai_notes?.stage_directions?.length > 0 && (
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
                  {setList.notes.ai_notes?.callback_opportunities?.length > 0 && (
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
                  {setList.notes.ai_notes?.audience_recovery_lines?.length > 0 && (
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
                  {setList.notes.ai_notes?.closing_suggestions?.length > 0 && (
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
                  {setList.notes.ai_notes?.general_notes && (
                    <div>
                      <h4 className="font-medium mb-2">General Notes</h4>
                      <p className="text-muted">{setList.notes.ai_notes.general_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
