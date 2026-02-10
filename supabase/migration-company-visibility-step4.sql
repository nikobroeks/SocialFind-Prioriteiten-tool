-- Step 4: Create trigger
-- Run this after step 3

DROP TRIGGER IF EXISTS update_company_visibility_updated_at ON public.company_visibility;

CREATE TRIGGER update_company_visibility_updated_at
  BEFORE UPDATE ON public.company_visibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

