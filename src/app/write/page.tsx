'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { JokeWriter } from '@/components/jokes/JokeWriter';
import { UpgradeModal } from '@/components/jokes/UpgradeModal';

export default function WritePage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 py-8 pt-24 md:pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Write a Joke</h1>
            <p className="text-muted">
              Get a prompt, write your joke, and get instant AI feedback.
            </p>
          </div>

          <JokeWriter onUpgradeClick={() => setShowUpgradeModal(true)} />
        </main>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </div>
    </AuthGuard>
  );
}
