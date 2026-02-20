-- Migration: Create user_company_collapse_state table
-- This table stores the collapsed state of companies per user

-- Create the table
CREATE TABLE IF NOT EXISTS public.user_company_collapse_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recruitee_company_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  is_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one collapse state per user and company
  UNIQUE(user_id, recruitee_company_id, company_name)
);

-- Indexen voor snelle queries
CREATE INDEX IF NOT EXISTS idx_company_collapse_user_id ON public.user_company_collapse_state(user_id);
CREATE INDEX IF NOT EXISTS idx_company_collapse_company_id ON public.user_company_collapse_state(recruitee_company_id);
CREATE INDEX IF NOT EXISTS idx_company_collapse_user_company ON public.user_company_collapse_state(user_id, recruitee_company_id);

-- RLS Policies
ALTER TABLE public.user_company_collapse_state ENABLE ROW LEVEL SECURITY;

-- Users kunnen alleen hun eigen collapse state lezen
CREATE POLICY "Users can view their own collapse state"
  ON public.user_company_collapse_state
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users kunnen alleen hun eigen collapse state aanmaken
CREATE POLICY "Users can insert their own collapse state"
  ON public.user_company_collapse_state
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users kunnen alleen hun eigen collapse state updaten
CREATE POLICY "Users can update their own collapse state"
  ON public.user_company_collapse_state
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users kunnen alleen hun eigen collapse state verwijderen
CREATE POLICY "Users can delete their own collapse state"
  ON public.user_company_collapse_state
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger voor updated_at
CREATE TRIGGER update_company_collapse_updated_at
  BEFORE UPDATE ON public.user_company_collapse_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

