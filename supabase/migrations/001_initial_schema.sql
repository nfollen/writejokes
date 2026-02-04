-- WriteJokes Database Schema
-- Run this in Supabase SQL Editor or via migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  jokes_this_month INTEGER DEFAULT 0,
  month_reset_date DATE DEFAULT CURRENT_DATE,
  favorite_comedians TEXT[] DEFAULT '{}',
  preferred_styles TEXT[] DEFAULT '{}',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jokes table
CREATE TABLE public.jokes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT,
  joke_text TEXT NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  tips TEXT[] DEFAULT '{}',
  style TEXT NOT NULL CHECK (style IN ('standup', 'one-liner', 'observational', 'dark-humor', 'puns', 'storytelling')),
  category TEXT CHECK (category IN ('relationships', 'work', 'technology', 'daily-life', 'absurdist', 'freeform')),
  is_freeform BOOLEAN DEFAULT FALSE,
  custom_tags TEXT[] DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set lists table
CREATE TABLE public.set_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_duration INTEGER DEFAULT 0,
  last_performed TIMESTAMPTZ,
  venue_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set list jokes junction table
CREATE TABLE public.set_list_jokes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  set_list_id UUID REFERENCES public.set_lists(id) ON DELETE CASCADE NOT NULL,
  joke_id UUID REFERENCES public.jokes(id) ON DELETE CASCADE NOT NULL,
  order_position INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(set_list_id, joke_id)
);

-- Set notes table (AI-generated performance notes)
CREATE TABLE public.set_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  set_list_id UUID REFERENCES public.set_lists(id) ON DELETE CASCADE NOT NULL,
  ai_notes JSONB NOT NULL DEFAULT '{}',
  user_edits TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt history (track which prompts user has seen)
CREATE TABLE public.prompt_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prompt_hash TEXT NOT NULL,
  category TEXT NOT NULL,
  style TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_hash)
);

-- Indexes for performance
CREATE INDEX idx_jokes_user_id ON public.jokes(user_id);
CREATE INDEX idx_jokes_created_at ON public.jokes(created_at DESC);
CREATE INDEX idx_jokes_score ON public.jokes(score);
CREATE INDEX idx_jokes_style ON public.jokes(style);
CREATE INDEX idx_set_lists_user_id ON public.set_lists(user_id);
CREATE INDEX idx_set_list_jokes_set_list_id ON public.set_list_jokes(set_list_id);
CREATE INDEX idx_set_list_jokes_order ON public.set_list_jokes(set_list_id, order_position);
CREATE INDEX idx_prompt_history_user ON public.prompt_history(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_list_jokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Jokes policies
CREATE POLICY "Users can view own jokes" ON public.jokes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jokes" ON public.jokes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jokes" ON public.jokes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jokes" ON public.jokes
  FOR DELETE USING (auth.uid() = user_id);

-- Set lists policies
CREATE POLICY "Users can view own set lists" ON public.set_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own set lists" ON public.set_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own set lists" ON public.set_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own set lists" ON public.set_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Set list jokes policies
CREATE POLICY "Users can view own set list jokes" ON public.set_list_jokes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.set_lists
      WHERE id = set_list_jokes.set_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own set list jokes" ON public.set_list_jokes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.set_lists
      WHERE id = set_list_jokes.set_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own set list jokes" ON public.set_list_jokes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.set_lists
      WHERE id = set_list_jokes.set_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own set list jokes" ON public.set_list_jokes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.set_lists
      WHERE id = set_list_jokes.set_list_id AND user_id = auth.uid()
    )
  );

-- Set notes policies
CREATE POLICY "Users can view own set notes" ON public.set_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.set_lists
      WHERE id = set_notes.set_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own set notes" ON public.set_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.set_lists
      WHERE id = set_notes.set_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own set notes" ON public.set_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.set_lists
      WHERE id = set_notes.set_list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own set notes" ON public.set_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.set_lists
      WHERE id = set_notes.set_list_id AND user_id = auth.uid()
    )
  );

-- Prompt history policies
CREATE POLICY "Users can view own prompt history" ON public.prompt_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompt history" ON public.prompt_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to reset monthly joke count
CREATE OR REPLACE FUNCTION public.reset_monthly_jokes()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET jokes_this_month = 0, month_reset_date = CURRENT_DATE
  WHERE month_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jokes_updated_at
  BEFORE UPDATE ON public.jokes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_set_lists_updated_at
  BEFORE UPDATE ON public.set_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_set_notes_updated_at
  BEFORE UPDATE ON public.set_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
