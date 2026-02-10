-- Step 3: Enable RLS and create policies
-- Run this after step 2

ALTER TABLE public.company_visibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view company visibility" ON public.company_visibility;
DROP POLICY IF EXISTS "Admins can insert company visibility" ON public.company_visibility;
DROP POLICY IF EXISTS "Admins can update company visibility" ON public.company_visibility;
DROP POLICY IF EXISTS "Admins can delete company visibility" ON public.company_visibility;

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

