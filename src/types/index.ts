// Core Types for WriteJokes

export type SubscriptionTier = 'free' | 'pro';

export type JokeStyle = 
  | 'standup' 
  | 'one-liner' 
  | 'observational' 
  | 'dark-humor' 
  | 'puns' 
  | 'storytelling';

export type JokeCategory = 
  | 'relationships' 
  | 'work' 
  | 'technology' 
  | 'daily-life' 
  | 'absurdist'
  | 'freeform';

export const COMEDIANS = [
  'George Carlin',
  'Dave Chappelle',
  'Mitch Hedberg',
  'Ali Wong',
  'John Mulaney',
  'Richard Pryor',
  'Jerry Seinfeld',
  'Hannah Gadsby',
  'Bill Burr',
  'Wanda Sykes',
  'Norm Macdonald',
  'Maria Bamford',
  'Bo Burnham',
  'Hasan Minhaj',
  'Nate Bargatze',
  'Taylor Tomlinson',
] as const;

export type Comedian = typeof COMEDIANS[number];

export const JOKE_STYLES: { value: JokeStyle; label: string; description: string }[] = [
  { value: 'standup', label: 'Standup', description: 'Classic setup-punchline format' },
  { value: 'one-liner', label: 'One-Liner', description: 'Quick, punchy single sentences' },
  { value: 'observational', label: 'Observational', description: 'Everyday life observations' },
  { value: 'dark-humor', label: 'Dark Humor', description: 'Edgy, taboo topics' },
  { value: 'puns', label: 'Puns', description: 'Wordplay and double meanings' },
  { value: 'storytelling', label: 'Storytelling', description: 'Longer narrative jokes' },
];

export const JOKE_CATEGORIES: { value: JokeCategory; label: string }[] = [
  { value: 'relationships', label: 'Relationships' },
  { value: 'work', label: 'Work' },
  { value: 'technology', label: 'Technology' },
  { value: 'daily-life', label: 'Daily Life' },
  { value: 'absurdist', label: 'Absurdist' },
  { value: 'freeform', label: 'Freeform' },
];

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  jokes_this_month: number;
  month_reset_date: string;
  favorite_comedians: string[];
  preferred_styles: JokeStyle[];
  onboarding_complete: boolean;
  default_wpm: number; // Words per minute for duration calculation (default 75)
  created_at: string;
  updated_at: string;
}

export interface Joke {
  id: string;
  user_id: string;
  prompt: string | null;
  joke_text: string;
  score: number | null;
  tips: string[];
  style: JokeStyle;
  category: JokeCategory | null;
  is_freeform: boolean;
  custom_tags: string[];
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface SetList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  total_duration: number;
  last_performed: string | null;
  venue_notes: string | null;
  created_at: string;
  updated_at: string;
  jokes?: SetListJoke[];
  notes?: SetNotes | null;
}

export interface SetListJoke {
  id: string;
  set_list_id: string;
  joke_id: string;
  order_position: number;
  notes: string | null;
  created_at: string;
  joke?: Joke;
}

export interface SetNotes {
  id: string;
  set_list_id: string;
  ai_notes: AISetNotes;
  user_edits: string | null;
  created_at: string;
  updated_at: string;
}

export interface AISetNotes {
  opening_suggestions: string[];
  closing_suggestions: string[];
  callback_opportunities: CallbackOpportunity[];
  stage_directions: StageDirection[];
  audience_recovery_lines: string[];
  general_notes: string;
}

export interface CallbackOpportunity {
  from_joke_index: number;
  to_joke_index: number;
  suggestion: string;
}

export interface StageDirection {
  joke_index: number;
  direction: string;
}

export interface JokeGradeResponse {
  score: number;
  tips: string[];
  analysis: string;
}

export interface GeneratedPrompt {
  prompt: string;
  category: JokeCategory;
  style: JokeStyle;
}

export interface UserStats {
  total_jokes: number;
  avg_score: number;
  jokes_by_style: Record<JokeStyle, number>;
  jokes_by_category: Record<JokeCategory, number>;
  score_over_time: { date: string; avg_score: number; count: number }[];
  favorite_style: JokeStyle | null;
  improvement_trajectory: number;
}

// Free tier limits
export const FREE_TIER_LIMITS = {
  jokes_per_month: 15,
  max_set_lists: 3,
  can_generate_sets: false,
  can_generate_notes: false,
} as const;

export const PRO_TIER_LIMITS = {
  jokes_per_month: Infinity,
  max_set_lists: Infinity,
  can_generate_sets: true,
  can_generate_notes: true,
} as const;
