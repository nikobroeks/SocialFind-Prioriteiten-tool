-- Fix RLS policies zodat admin emails hun eigen rol kunnen toevoegen
-- Voer dit uit in Supabase SQL Editor

-- Drop bestaande policies voor user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Nieuwe policy: Iedereen kan zijn eigen rol lezen
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins kunnen alle rollen lezen
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Nieuwe policy: Admin emails kunnen hun eigen admin rol toevoegen
-- Dit maakt het mogelijk voor admin@admin en niko@socialfind.nl om hun rol toe te voegen
CREATE POLICY "Admin emails can insert their own admin role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND email IN ('admin@admin', 'niko@socialfind.nl')
    AND role = 'admin'
  );

-- Admins kunnen rollen updaten
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

