'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Check, Crown, Zap, Infinity, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Infinity, text: 'Unlimited jokes per month' },
    { icon: Sparkles, text: 'AI-generated set lists' },
    { icon: Zap, text: 'Performance notes & callbacks' },
    { icon: Crown, text: 'Unlimited set lists' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Pro" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Level Up Your Comedy</h3>
          <p className="text-muted">
            You've reached the free tier limit. Upgrade to unlock unlimited potential.
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-sm text-muted mb-1">Monthly</div>
            <div className="text-2xl font-bold">$10</div>
            <div className="text-sm text-muted">/month</div>
          </button>

          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-xl border-2 transition-all text-left relative ${
              selectedPlan === 'yearly'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-success text-white text-xs font-bold rounded-full">
              Save $21
            </div>
            <div className="text-sm text-muted mb-1">Yearly</div>
            <div className="text-2xl font-bold">$99</div>
            <div className="text-sm text-muted">/year ($8.25/mo)</div>
          </button>
        </div>

        {/* Features */}
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleUpgrade}
          loading={isLoading}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Pro - {selectedPlan === 'monthly' ? '$10/mo' : '$99/yr'}
        </Button>

        <p className="text-xs text-muted text-center">
          Cancel anytime. No questions asked.
        </p>
      </div>
    </Modal>
  );
}
