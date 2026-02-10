-- Ultra simple version - no foreign keys, no complex constraints
-- Run this first to test if it's a connection issue

CREATE TABLE IF NOT EXISTS public.company_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitee_company_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID
);

