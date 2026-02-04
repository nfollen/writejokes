'use client';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { SetListManager } from '@/components/setlists/SetListManager';

export default function SetListsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 py-8 pt-24 md:pt-20">
          <SetListManager />
        </main>
      </div>
    </AuthGuard>
  );
}
