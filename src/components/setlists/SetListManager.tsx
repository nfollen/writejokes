'use client';

import { useState } from 'react';
import { useSetLists } from '@/hooks/useSetLists';
import { useJokes } from '@/hooks/useJokes';
import { useUser } from '@/hooks/useUser';
import { useStore } from '@/lib/store';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { JokeCard } from '@/components/jokes/JokeCard';
import { SetListColumn } from './SetListColumn';
import { DroppableJokePool } from './DroppableJokePool';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { canCreateSetList, formatDuration, getTierLimits, generateExportText } from '@/lib/utils';
import type { Joke, SetList } from '@/types';
import { Plus, Sparkles, FileText, Download } from 'lucide-react';

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

  const [activeJoke, setActiveJoke] = useState<Joke | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetListName, setNewSetListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingDuration, setGeneratingDuration] = useState<5 | 10 | 15>(5);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [targetSetList, setTargetSetList] = useState<SetList | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!user) return null;

  const limits = getTierLimits(user.subscription_tier);
  const canCreate = canCreateSetList(user, setLists.length);

  // Get jokes not in any set list
  const jokesInSets = new Set(
    setLists.flatMap((s) => s.jokes?.map((j) => j.joke_id) || [])
  );
  const availableJokes = jokes.filter((j) => !jokesInSets.has(j.id));

  const handleDragStart = (event: DragStartEvent) => {
    const joke = jokes.find((j) => j.id === event.active.id);
    if (joke) setActiveJoke(joke);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveJoke(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropping on a set list
    if (overId.startsWith('setlist-')) {
      const setListId = overId.replace('setlist-', '');
      const jokeInPool = availableJokes.find((j) => j.id === activeId);
      
      if (jokeInPool) {
        await addJokeToSetList(setListId, activeId);
      }
    }

    // Check if reordering within a set list
    const sourceSetList = setLists.find((s) =>
      s.jokes?.some((j) => j.joke_id === activeId)
    );

    if (sourceSetList) {
      const overSetListJoke = sourceSetList.jokes?.find(
        (j) => j.joke_id === overId || j.id === overId
      );

      if (overSetListJoke) {
        const oldIndex = sourceSetList.jokes!.findIndex(
          (j) => j.joke_id === activeId
        );
        const newIndex = sourceSetList.jokes!.findIndex(
          (j) => j.joke_id === overId || j.id === overId
        );

        const newOrder = arrayMove(
          sourceSetList.jokes!.map((j) => j.joke_id),
          oldIndex,
          newIndex
        );

        await reorderJokes(sourceSetList.id, newOrder);
      }
    }
  };

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
    // PDF export would require a library like jsPDF
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Set Lists</h2>
          <p className="text-muted">
            Drag jokes to build your sets. {!canCreate && '(Upgrade for unlimited)'}
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Joke Pool */}
          <div className="lg:col-span-1">
            <DroppableJokePool jokes={availableJokes} />
          </div>

          {/* Set Lists */}
          <div className="lg:col-span-2 space-y-6">
            {setLists.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted mb-4">No set lists yet. Create your first one!</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Set List
                </Button>
              </div>
            ) : (
              setLists.map((setList) => (
                <SetListColumn
                  key={setList.id}
                  setList={setList}
                  onDelete={removeSetList}
                  onRemoveJoke={removeJokeFromSetList}
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
        </div>

        <DragOverlay>
          {activeJoke && (
            <div className="opacity-80 transform scale-105">
              <JokeCard joke={activeJoke} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
