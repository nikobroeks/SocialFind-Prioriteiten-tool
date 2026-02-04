-- ============================================
-- Migration: Add Job Visibility Table
-- ============================================
-- This migration adds the job_visibility table
-- Run this if you already have the base schema

-- Create job_visibility table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.job_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruitee_job_id INTEGER NOT NULL,
  recruitee_company_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Unieke constraint: één visibility setting per job
  UNIQUE(recruitee_job_id, recruitee_company_id)
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_job_visibility_job_id ON public.job_visibility(recruitee_job_id);
CREATE INDEX IF NOT EXISTS idx_job_visibility_company_id ON public.job_visibility(recruitee_company_id);
CREATE INDEX IF NOT EXISTS idx_job_visibility_company_name ON public.job_visibility(company_name);
CREATE INDEX IF NOT EXISTS idx_job_visibility_is_visible ON public.job_visibility(is_visible);

-- Enable RLS
ALTER TABLE public.job_visibility ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can view job visibility" ON public.job_visibility;
DROP POLICY IF EXISTS "Admins can insert job visibility" ON public.job_visibility;
DROP POLICY IF EXISTS "Admins can update job visibility" ON public.job_visibility;
DROP POLICY IF EXISTS "Admins can delete job visibility" ON public.job_visibility;

-- Create RLS Policies
CREATE POLICY "Authenticated users can view job visibility"
  ON public.job_visibility
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert job visibility"
  ON public.job_visibility
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update job visibility"
  ON public.job_visibility
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete job visibility"
  ON public.job_visibility
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_job_visibility_updated_at ON public.job_visibility;
CREATE TRIGGER update_job_visibility_updated_at
  BEFORE UPDATE ON public.job_visibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

