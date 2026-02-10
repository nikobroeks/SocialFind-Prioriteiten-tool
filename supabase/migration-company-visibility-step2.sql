-- Step 2: Create indexes
-- Run this after step 1

CREATE INDEX IF NOT EXISTS idx_company_visibility_company_id ON public.company_visibility(recruitee_company_id);
CREATE INDEX IF NOT EXISTS idx_company_visibility_company_name ON public.company_visibility(company_name);
CREATE INDEX IF NOT EXISTS idx_company_visibility_is_visible ON public.company_visibility(is_visible);

