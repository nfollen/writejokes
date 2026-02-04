import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { User, FREE_TIER_LIMITS, PRO_TIER_LIMITS } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export function getTierLimits(tier: 'free' | 'pro') {
  if (tier === 'pro') {
    return {
      jokes_per_month: Infinity,
      max_set_lists: Infinity,
      can_generate_sets: true,
      can_generate_notes: true,
    };
  }
  return {
    jokes_per_month: 15,
    max_set_lists: 3,
    can_generate_sets: false,
    can_generate_notes: false,
  };
}

export function canWriteJoke(user: User): { allowed: boolean; remaining: number } {
  const limits = getTierLimits(user.subscription_tier);
  if (limits.jokes_per_month === Infinity) {
    return { allowed: true, remaining: Infinity };
  }
  const remaining = limits.jokes_per_month - user.jokes_this_month;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export function canCreateSetList(user: User, currentCount: number): boolean {
  const limits = getTierLimits(user.subscription_tier);
  if (limits.max_set_lists === Infinity) return true;
  return currentCount < limits.max_set_lists;
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-success';
  if (score >= 6) return 'text-primary';
  if (score >= 4) return 'text-warning';
  return 'text-error';
}

export function getScoreBgColor(score: number): string {
  if (score >= 8) return 'bg-success/20';
  if (score >= 6) return 'bg-primary/20';
  if (score >= 4) return 'bg-warning/20';
  return 'bg-error/20';
}

export function getScoreEmoji(score: number): string {
  if (score >= 9) return '🎤🔥';
  if (score >= 8) return '😂';
  if (score >= 6) return '😄';
  if (score >= 4) return '🙂';
  if (score >= 2) return '😐';
  return '😬';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

export function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function generateExportText(
  setName: string,
  jokes: { joke_text: string; notes?: string }[],
  venueNotes?: string
): string {
  let output = `SET LIST: ${setName}\n`;
  output += '='.repeat(40) + '\n\n';
  
  if (venueNotes) {
    output += `Venue Notes: ${venueNotes}\n\n`;
  }
  
  jokes.forEach((joke, index) => {
    output += `${index + 1}. ${joke.joke_text}\n`;
    if (joke.notes) {
      output += `   Notes: ${joke.notes}\n`;
    }
    output += '\n';
  });
  
  output += '='.repeat(40) + '\n';
  output += `Total jokes: ${jokes.length}\n`;
  
  return output;
}
