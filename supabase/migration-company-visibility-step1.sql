-- Step 1: Create company_visibility table
-- Run this first

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

