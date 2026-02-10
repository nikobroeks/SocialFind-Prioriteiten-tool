-- Minimal migration - only creates table if it doesn't exist
-- This should be very fast

DO $$ 
BEGIN
  -- Check if table exists, if not create it
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'company_visibility'
  ) THEN
    CREATE TABLE public.company_visibility (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      recruitee_company_id INTEGER NOT NULL,
      company_name TEXT NOT NULL,
      is_visible BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_by UUID REFERENCES auth.users(id),
      UNIQUE(recruitee_company_id, company_name)
    );
  END IF;
END $$;

