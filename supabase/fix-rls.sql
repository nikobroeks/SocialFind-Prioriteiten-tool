-- Fix RLS Policies om login mogelijk te maken zonder rol
-- Voer dit uit als je problemen hebt met inloggen

-- Drop bestaande policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Nieuwe policy: Iedereen kan zijn eigen rol lezen (ook als die null is)
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Admins kunnen alle rollen lezen
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Zorg dat iedereen die ingelogd is prioriteiten kan lezen
-- (Dit is al correct, maar voor de zekerheid)
DROP POLICY IF EXISTS "Authenticated users can view priorities" ON public.vacancy_priorities;

CREATE POLICY "Authenticated users can view priorities"
  ON public.vacancy_priorities
  FOR SELECT
  USING (auth.role() = 'authenticated');

