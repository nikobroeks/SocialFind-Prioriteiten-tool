-- Migration: Update company_hours table to support weekly tracking
-- This adds week_start_date column and updates the unique constraint

-- Step 1: Add week_start_date column (defaults to current week's Monday)
ALTER TABLE public.company_hours 
ADD COLUMN IF NOT EXISTS week_start_date DATE NOT NULL DEFAULT (
  DATE_TRUNC('week', CURRENT_DATE)::DATE
);

-- Step 2: Update existing records to have week_start_date set to their created_at week's Monday
UPDATE public.company_hours
SET week_start_date = DATE_TRUNC('week', created_at)::DATE
WHERE week_start_date IS NULL OR week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE;

-- Step 3: Drop old unique constraint
ALTER TABLE public.company_hours
DROP CONSTRAINT IF EXISTS company_hours_recruitee_company_id_company_name_key;

-- Step 4: Add new unique constraint including week_start_date
ALTER TABLE public.company_hours
ADD CONSTRAINT company_hours_unique_per_week 
UNIQUE (recruitee_company_id, company_name, week_start_date);

-- Step 5: Create index for faster week-based queries
CREATE INDEX IF NOT EXISTS idx_company_hours_week_start_date 
ON public.company_hours(week_start_date);

-- Step 6: Create index for company + week queries
CREATE INDEX IF NOT EXISTS idx_company_hours_company_week 
ON public.company_hours(recruitee_company_id, company_name, week_start_date);

