-- Voeg INSERT policy toe voor admin emails
-- Voer dit uit in Supabase SQL Editor

-- Drop bestaande policies als ze bestaan (om errors te voorkomen)
DROP POLICY IF EXISTS "Admin emails can insert their own admin role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

-- Voeg policy toe zodat admin emails hun eigen admin rol kunnen toevoegen
CREATE POLICY "Admin emails can insert their own admin role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    -- De user_id moet overeenkomen met de ingelogde user
    auth.uid() = user_id 
    -- En het email moet een admin email zijn
    AND email IN ('admin@admin', 'niko@socialfind.nl')
    -- En de rol moet admin zijn
    AND role = 'admin'
  );

-- Voeg ook UPDATE policy toe voor admins
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

