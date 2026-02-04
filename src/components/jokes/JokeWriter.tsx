'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useJokes } from '@/hooks/useJokes';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { canWriteJoke, getScoreColor, getScoreEmoji } from '@/lib/utils';
import { JOKE_STYLES, JOKE_CATEGORIES, type JokeStyle, type JokeCategory } from '@/types';
import { Sparkles, Shuffle, Send, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JokeWriterProps {
  onUpgradeClick: () => void;
}

export function JokeWriter({ onUpgradeClick }: JokeWriterProps) {
  const { user, refreshUser } = useUser();
  const { createJoke } = useJokes();
  const {
    currentPrompt,
    setCurrentPrompt,
    selectedStyle,
    setSelectedStyle,
    selectedCategory,
    setSelectedCategory,
    jokeText,
    setJokeText,
    isGrading,
    setIsGrading,
  } = useStore();

  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [gradeResult, setGradeResult] = useState<{
    score: number;
    tips: string[];
    analysis: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(30);

  if (!user) return null;

  const { allowed: canWrite, remaining } = canWriteJoke(user);

  const generatePrompt = async () => {
    setIsGeneratingPrompt(true);
    setError(null);
    setGradeResult(null);
    setJokeText('');

    try {
      const response = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          style: selectedStyle,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate prompt');

      const data = await response.json();
      setCurrentPrompt(data);
    } catch (err) {
      setError('Failed to generate prompt. Please try again.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const submitJoke = async (isFreeform = false) => {
    if (!jokeText.trim()) {
      setError('Please write your joke first!');
      return;
    }

    if (!canWrite) {
      onUpgradeClick();
      return;
    }

    setIsGrading(true);
    setError(null);

    try {
      // Grade the joke
      const gradeResponse = await fetch('/api/jokes/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jokeText,
          prompt: isFreeform ? null : currentPrompt?.prompt,
          style: selectedStyle,
        }),
      });

      if (!gradeResponse.ok) throw new Error('Failed to grade joke');

      const gradeData = await gradeResponse.json();
      setGradeResult(gradeData);

      // Save the joke
      await createJoke({
        prompt: isFreeform ? null : currentPrompt?.prompt || null,
        joke_text: jokeText,
        score: gradeData.score,
        tips: gradeData.tips,
        style: selectedStyle,
        category: isFreeform ? 'freeform' : selectedCategory,
        is_freeform: isFreeform,
        custom_tags: [],
        duration_seconds: durationSeconds,
      });

      await refreshUser();
    } catch (err) {
      setError('Failed to submit joke. Please try again.');
    } finally {
      setIsGrading(false);
    }
  };

  const resetWriter = () => {
    setJokeText('');
    setGradeResult(null);
    setCurrentPrompt(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Usage Indicator */}
      {user.subscription_tier === 'free' && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
            <span className="text-sm text-muted">
              {remaining} jokes remaining this month
            </span>
          </div>
          {remaining <= 5 && (
            <Button size="sm" onClick={onUpgradeClick}>
              Upgrade to Pro
            </Button>
          )}
        </div>
      )}

      {/* Style & Category Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Joke Style"
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value as JokeStyle)}
          options={JOKE_STYLES.map((s) => ({ value: s.value, label: s.label }))}
        />
        <Select
          label="Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as JokeCategory)}
          options={JOKE_CATEGORIES.filter((c) => c.value !== 'freeform').map((c) => ({
            value: c.value,
            label: c.label,
          }))}
        />
      </div>

      {/* Prompt Display or Generator */}
      <Card>
        <CardContent>
          {currentPrompt ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="primary" className="mb-2">
                    {JOKE_STYLES.find((s) => s.value === currentPrompt.style)?.label}
                  </Badge>
                  <p className="text-lg text-foreground">{currentPrompt.prompt}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generatePrompt}
                  loading={isGeneratingPrompt}
                  icon={<Shuffle className="w-4 h-4" />}
                >
                  New
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Get a Writing Prompt</h3>
              <p className="text-muted mb-6">
                Let AI generate a creative prompt based on your style and category
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={generatePrompt}
                  loading={isGeneratingPrompt}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Generate Prompt
                </Button>
                <Button variant="ghost" onClick={() => submitJoke(true)}>
                  Write Freeform Instead
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Writing Area */}
      {(currentPrompt || gradeResult) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Textarea
            placeholder="Write your joke here... Let it flow, don't overthink it!"
            value={jokeText}
            onChange={(e) => setJokeText(e.target.value)}
            showCount
            className="min-h-[200px] text-xl"
            disabled={isGrading}
          />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted">Duration:</label>
              <input
                type="number"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm"
                min={5}
                max={600}
              />
              <span className="text-sm text-muted">seconds</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-error/10 border border-error/30">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => submitJoke(false)}
              loading={isGrading}
              disabled={!jokeText.trim() || !canWrite}
              icon={<Send className="w-4 h-4" />}
              className="flex-1"
            >
              {isGrading ? 'Grading...' : 'Submit & Grade'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Grade Result */}
      <AnimatePresence>
        {gradeResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="overflow-hidden">
              {/* Score Display */}
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-8 text-center border-b border-border">
                <div className="text-6xl mb-2">{getScoreEmoji(gradeResult.score)}</div>
                <div className={`text-5xl font-bold ${getScoreColor(gradeResult.score)}`}>
                  {gradeResult.score}/10
                </div>
                <p className="text-muted mt-2">Comedy Score</p>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Analysis */}
                <div>
                  <h4 className="font-semibold mb-2">Analysis</h4>
                  <p className="text-muted">{gradeResult.analysis}</p>
                </div>

                {/* Tips */}
                <div>
                  <h4 className="font-semibold mb-3">Tips to Improve</h4>
                  <ul className="space-y-2">
                    {gradeResult.tips.map((tip, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-card-hover"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button onClick={resetWriter} className="w-full" variant="secondary">
                  Write Another Joke
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
