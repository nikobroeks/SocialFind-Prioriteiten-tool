-- Migration: Add company_visibility table (Simplified version)
-- Run this step by step if you get timeout errors

-- Step 1: Create table
CREATE TABLE IF NOT EXISTS public.company_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruitee_company_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(recruitee_company_id, company_name)
);

-- Step 2: Create indexes (run this separately)
CREATE INDEX IF NOT EXISTS idx_company_visibility_company_id ON public.company_visibility(recruitee_company_id);
CREATE INDEX IF NOT EXISTS idx_company_visibility_company_name ON public.company_visibility(company_name);
CREATE INDEX IF NOT EXISTS idx_company_visibility_is_visible ON public.company_visibility(is_visible);

-- Step 3: Enable RLS (run this separately)
ALTER TABLE public.company_visibility ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (run this separately)
CREATE POLICY "Authenticated users can view company visibility"
  ON public.company_visibility FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert company visibility"
  ON public.company_visibility FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update company visibility"
  ON public.company_visibility FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete company visibility"
  ON public.company_visibility FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Step 5: Create trigger (run this separately)
CREATE TRIGGER update_company_visibility_updated_at
  BEFORE UPDATE ON public.company_visibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

