-- Complete fix voor RLS policies zodat admin emails hun eigen rol kunnen toevoegen
-- Voer dit uit in Supabase SQL Editor

-- Drop alle bestaande policies voor user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin emails can insert their own admin role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

-- Policy 1: Iedereen kan zijn eigen rol lezen
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Admins kunnen alle rollen lezen
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Policy 3: Admin emails kunnen hun eigen admin rol toevoegen
-- Dit werkt voor zowel client-side als server-side calls
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

-- Policy 4: Admins kunnen rollen updaten
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Test: Check of de policies correct zijn aangemaakt
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_roles';

