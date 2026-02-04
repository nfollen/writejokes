'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { COMEDIANS, JOKE_STYLES, type JokeStyle } from '@/types';
import { Mic2, ArrowRight, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedComedians, setSelectedComedians] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<JokeStyle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUser } = useStore();
  const supabase = createClient();

  const toggleComedian = (comedian: string) => {
    setSelectedComedians((prev) =>
      prev.includes(comedian)
        ? prev.filter((c) => c !== comedian)
        : [...prev, comedian]
    );
  };

  const toggleStyle = (style: JokeStyle) => {
    setSelectedStyles((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : [...prev, style]
    );
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          favorite_comedians: selectedComedians,
          preferred_styles: selectedStyles,
          onboarding_complete: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      updateUser({
        favorite_comedians: selectedComedians,
        preferred_styles: selectedStyles,
        onboarding_complete: true,
      });

      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="" size="lg">
      {step === 1 && (
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <Mic2 className="w-10 h-10 text-primary" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome to WriteJokes! 🎤</h2>
            <p className="text-muted">
              Let's personalize your experience. This will help us give you better
              prompts and more relevant feedback.
            </p>
          </div>

          <Button onClick={() => setStep(2)} icon={<ArrowRight className="w-4 h-4" />}>
            Let's Go
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Who inspires you?</h2>
            <p className="text-muted text-sm">
              Select comedians whose style you admire. This helps us tailor prompts and grading.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-1">
            {COMEDIANS.map((comedian) => (
              <button
                key={comedian}
                onClick={() => toggleComedian(comedian)}
                className={`px-4 py-2 rounded-full border transition-all ${
                  selectedComedians.includes(comedian)
                    ? 'bg-primary border-primary text-white'
                    : 'border-border hover:border-primary/50 text-foreground'
                }`}
              >
                {selectedComedians.includes(comedian) && (
                  <Check className="w-4 h-4 inline mr-1" />
                )}
                {comedian}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-2">What's your style?</h2>
            <p className="text-muted text-sm">
              Select the joke styles you want to practice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {JOKE_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => toggleStyle(style.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedStyles.includes(style.value)
                    ? 'bg-primary/10 border-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{style.label}</span>
                  {selectedStyles.includes(style.value) && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted">{style.description}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleComplete} loading={isLoading} className="flex-1">
              Start Writing!
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
