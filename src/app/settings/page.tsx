'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useStore } from '@/lib/store';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { COMEDIANS, JOKE_STYLES, type JokeStyle } from '@/types';
import { formatDate, getTierLimits } from '@/lib/utils';
import { 
  Crown, 
  CreditCard, 
  User, 
  Settings2, 
  Check,
  ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useUser();
  const { updateUser } = useStore();
  const supabase = createClient();
  
  const [selectedComedians, setSelectedComedians] = useState<string[]>(
    user?.favorite_comedians || []
  );
  const [selectedStyles, setSelectedStyles] = useState<JokeStyle[]>(
    user?.preferred_styles || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  if (!user) return null;

  const limits = getTierLimits(user.subscription_tier);

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

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          favorite_comedians: selectedComedians,
          preferred_styles: selectedStyles,
        })
        .eq('id', user.id);

      if (error) throw error;

      updateUser({
        favorite_comedians: selectedComedians,
        preferred_styles: selectedStyles,
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const openBillingPortal = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 py-8 pt-24 md:pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted">Manage your account and preferences.</p>
          </div>

          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.display_name || 'User'}</p>
                    <p className="text-sm text-muted">{user.email}</p>
                  </div>
                  <Badge variant={user.subscription_tier === 'pro' ? 'primary' : 'default'}>
                    {user.subscription_tier === 'pro' ? (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        Pro
                      </>
                    ) : (
                      'Free'
                    )}
                  </Badge>
                </div>
                <div className="text-sm text-muted">
                  <p>Member since {formatDate(user.created_at)}</p>
                  <p>
                    {user.subscription_tier === 'free'
                      ? `${15 - user.jokes_this_month} jokes remaining this month`
                      : 'Unlimited jokes'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.subscription_tier === 'pro' ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Pro Plan Active</span>
                      </div>
                      <p className="text-sm text-muted">
                        You have access to all features including unlimited jokes, 
                        AI set generation, and performance notes.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={openBillingPortal}
                      loading={isLoadingPortal}
                      icon={<ExternalLink className="w-4 h-4" />}
                    >
                      Manage Billing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-muted">
                      Upgrade to Pro for unlimited jokes and premium features.
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleUpgrade('monthly')}
                        className="p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left"
                      >
                        <p className="font-semibold">Monthly</p>
                        <p className="text-2xl font-bold mt-1">$10<span className="text-sm text-muted">/mo</span></p>
                      </button>
                      
                      <button
                        onClick={() => handleUpgrade('yearly')}
                        className="p-4 rounded-xl border-2 border-primary bg-primary/10 transition-all text-left relative"
                      >
                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-success text-white text-xs font-bold rounded-full">
                          Save $21
                        </div>
                        <p className="font-semibold">Yearly</p>
                        <p className="text-2xl font-bold mt-1">$99<span className="text-sm text-muted">/yr</span></p>
                      </button>
                    </div>

                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Unlimited jokes
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        AI set list generation
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Performance notes & callbacks
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Unlimited set lists
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comedy Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Comedy Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Favorite Comedians */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Favorite Comedians
                  </label>
                  <p className="text-sm text-muted mb-3">
                    These influence your prompts and grading style.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COMEDIANS.map((comedian) => (
                      <button
                        key={comedian}
                        onClick={() => toggleComedian(comedian)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          selectedComedians.includes(comedian)
                            ? 'bg-primary text-white'
                            : 'bg-card border border-border hover:border-primary/50'
                        }`}
                      >
                        {selectedComedians.includes(comedian) && (
                          <Check className="w-3 h-3 inline mr-1" />
                        )}
                        {comedian}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Styles */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Preferred Styles
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {JOKE_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => toggleStyle(style.value)}
                        className={`p-3 rounded-lg border text-sm text-left transition-all ${
                          selectedStyles.includes(style.value)
                            ? 'bg-primary/10 border-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{style.label}</span>
                          {selectedStyles.includes(style.value) && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={savePreferences} loading={isSaving}>
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
