-- Migration: Create company_recruiters table
-- This table stores recruiter and buddy assignments per company

-- Create the table
CREATE TABLE IF NOT EXISTS public.company_recruiters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruitee_company_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  recruiter TEXT CHECK (recruiter IN ('Ken', 'Sam', 'Lois', 'Fatih', 'Just', 'Maris', 'Ylin', 'Sieme') OR recruiter IS NULL),
  buddy TEXT CHECK (buddy IN ('Ken', 'Sam', 'Lois', 'Fatih', 'Just', 'Maris', 'Ylin', 'Sieme') OR buddy IS NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Unique constraint: one recruiter/buddy assignment per company
  UNIQUE(recruitee_company_id, company_name)
);

-- Indexen voor snelle queries
CREATE INDEX IF NOT EXISTS idx_company_recruiters_company_id ON public.company_recruiters(recruitee_company_id);
CREATE INDEX IF NOT EXISTS idx_company_recruiters_company_name ON public.company_recruiters(company_name);
CREATE INDEX IF NOT EXISTS idx_company_recruiters_recruiter ON public.company_recruiters(recruiter);
CREATE INDEX IF NOT EXISTS idx_company_recruiters_buddy ON public.company_recruiters(buddy);

-- RLS Policies
ALTER TABLE public.company_recruiters ENABLE ROW LEVEL SECURITY;

-- Iedereen kan recruiters lezen
CREATE POLICY "Authenticated users can view company recruiters"
  ON public.company_recruiters
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Alleen admins kunnen recruiters aanmaken
CREATE POLICY "Admins can insert company recruiters"
  ON public.company_recruiters
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Alleen admins kunnen recruiters updaten
CREATE POLICY "Admins can update company recruiters"
  ON public.company_recruiters
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Alleen admins kunnen recruiters verwijderen
CREATE POLICY "Admins can delete company recruiters"
  ON public.company_recruiters
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Trigger voor updated_at
CREATE TRIGGER update_company_recruiters_updated_at
  BEFORE UPDATE ON public.company_recruiters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

