-- Migration: Add company_hours table for manual hour tracking
-- This table stores total hours budget and spent hours per company

-- Step 1: Create table
CREATE TABLE IF NOT EXISTS public.company_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruitee_company_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  total_hours DECIMAL(10, 2) DEFAULT 0,
  spent_hours DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(recruitee_company_id, company_name)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_company_hours_company_id ON public.company_hours(recruitee_company_id);
CREATE INDEX IF NOT EXISTS idx_company_hours_company_name ON public.company_hours(company_name);

-- Step 3: Enable RLS
ALTER TABLE public.company_hours ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies
CREATE POLICY "Authenticated users can view company hours"
  ON public.company_hours FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert company hours"
  ON public.company_hours FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update company hours"
  ON public.company_hours FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete company hours"
  ON public.company_hours FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Step 5: Create trigger for updated_at
CREATE TRIGGER update_company_hours_updated_at
  BEFORE UPDATE ON public.company_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

