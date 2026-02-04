'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { 
  Mic2, 
  PenLine, 
  History, 
  ListMusic, 
  BarChart3, 
  Settings,
  LogOut,
  Crown
} from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useUser();
  const pathname = usePathname();

  const links = [
    { href: '/write', label: 'Write', icon: PenLine },
    { href: '/history', label: 'History', icon: History },
    { href: '/setlists', label: 'Set Lists', icon: ListMusic },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
  ];

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Mic2 className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg hidden sm:block">WriteJokes</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-muted hover:text-foreground hover:bg-card'
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {user.subscription_tier === 'pro' && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-500">PRO</span>
              </div>
            )}
            
            <Link href="/settings">
              <Button variant="ghost" size="sm" icon={<Settings className="w-4 h-4" />}>
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              icon={<LogOut className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border">
        <div className="flex justify-around py-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'text-primary'
                    : 'text-muted'
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
