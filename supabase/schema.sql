-- ============================================
-- SocialFind Prioriteiten Dashboard Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users & Roles Table
-- ============================================
-- Deze tabel slaat de rol van gebruikers op (Admin of Viewer)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor snelle lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_email ON public.user_roles(email);

-- ============================================
-- Vacancy Priorities Table
-- ============================================
-- Deze tabel slaat de prioriteits-metadata op gekoppeld aan Recruitee vacatures
CREATE TABLE public.vacancy_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruitee_job_id INTEGER NOT NULL,
  recruitee_company_id INTEGER NOT NULL,
  
  -- De 4 pijlers
  client_pain_level TEXT CHECK (client_pain_level IN ('Nee', 'Beginnend', 'Ja')),
  time_criticality TEXT CHECK (time_criticality IN ('Net begonnen', 'Lopend', 'Tegen het einde van samenwerking')),
  strategic_value TEXT CHECK (strategic_value IN ('C-klant', 'B-klant', 'A-klant')),
  account_health TEXT CHECK (account_health IN ('Tevreden stakeholder', 'Onrustige stakeholder', 'Kans op churn')),
  
  -- Oude velden (voor backward compatibility - kunnen later verwijderd worden)
  strategy_score TEXT CHECK (strategy_score IN ('Key Account', 'Longterm', 'Ad-hoc')),
  hiring_chance TEXT CHECK (hiring_chance IN ('High', 'Medium', 'Low')),
  client_pain BOOLEAN DEFAULT FALSE,
  
  -- Automatisch berekende prioriteit
  calculated_priority TEXT NOT NULL CHECK (calculated_priority IN ('Red', 'Orange', 'Green')),
  
  -- Handmatige override (NULL betekent geen override)
  manual_override TEXT CHECK (manual_override IN ('Red', 'Orange', 'Green')),
  
  -- Notities
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Unieke constraint: één prioriteit per vacature
  UNIQUE(recruitee_job_id, recruitee_company_id)
);

-- Indexen voor snelle queries
CREATE INDEX idx_vacancy_priorities_job_id ON public.vacancy_priorities(recruitee_job_id);
CREATE INDEX idx_vacancy_priorities_company_id ON public.vacancy_priorities(recruitee_company_id);
CREATE INDEX idx_vacancy_priorities_calculated_priority ON public.vacancy_priorities(calculated_priority);

-- ============================================
-- Helper Function: Check if user is admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND user_roles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper Function: Get user role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_roles
    WHERE user_roles.user_id = get_user_role.user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Trigger: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vacancy_priorities_updated_at
  BEFORE UPDATE ON public.vacancy_priorities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS op beide tabellen
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancy_priorities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- User Roles Policies
-- ============================================

-- Iedereen kan zijn eigen rol lezen
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins kunnen alle rollen lezen
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================
-- Vacancy Priorities Policies
-- ============================================

-- Iedereen kan prioriteiten lezen (viewers en admins)
CREATE POLICY "Authenticated users can view priorities"
  ON public.vacancy_priorities
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Alleen admins kunnen prioriteiten aanmaken
CREATE POLICY "Admins can insert priorities"
  ON public.vacancy_priorities
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Alleen admins kunnen prioriteiten updaten
CREATE POLICY "Admins can update priorities"
  ON public.vacancy_priorities
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Alleen admins kunnen prioriteiten verwijderen
CREATE POLICY "Admins can delete priorities"
  ON public.vacancy_priorities
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- Recruitee Cache Table
-- ============================================
-- Deze tabel slaat gecachte Recruitee data op voor snellere laadtijden
CREATE TABLE public.recruitee_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  jobs JSONB NOT NULL DEFAULT '[]'::jsonb,
  hires JSONB NOT NULL DEFAULT '[]'::jsonb,
  applications JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor snelle lookups
CREATE INDEX idx_recruitee_cache_user_id ON public.recruitee_cache(user_id);
CREATE INDEX idx_recruitee_cache_cached_at ON public.recruitee_cache(cached_at);

-- RLS Policies voor cache
ALTER TABLE public.recruitee_cache ENABLE ROW LEVEL SECURITY;

-- Users kunnen alleen hun eigen cache lezen
CREATE POLICY "Users can view their own cache"
  ON public.recruitee_cache
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users kunnen alleen hun eigen cache updaten
CREATE POLICY "Users can update their own cache"
  ON public.recruitee_cache
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger voor updated_at
CREATE TRIGGER update_recruitee_cache_updated_at
  BEFORE UPDATE ON public.recruitee_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Job Visibility Table
-- ============================================
-- Deze tabel slaat op welke jobs zichtbaar zijn per bedrijf
CREATE TABLE public.job_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruitee_job_id INTEGER NOT NULL,
  recruitee_company_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Unieke constraint: één visibility setting per job
  UNIQUE(recruitee_job_id, recruitee_company_id)
);

-- Indexen voor snelle queries
CREATE INDEX idx_job_visibility_job_id ON public.job_visibility(recruitee_job_id);
CREATE INDEX idx_job_visibility_company_id ON public.job_visibility(recruitee_company_id);
CREATE INDEX idx_job_visibility_company_name ON public.job_visibility(company_name);
CREATE INDEX idx_job_visibility_is_visible ON public.job_visibility(is_visible);

-- RLS Policies voor job visibility
ALTER TABLE public.job_visibility ENABLE ROW LEVEL SECURITY;

-- Iedereen kan visibility lezen
CREATE POLICY "Authenticated users can view job visibility"
  ON public.job_visibility
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Alleen admins kunnen visibility aanmaken
CREATE POLICY "Admins can insert job visibility"
  ON public.job_visibility
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Alleen admins kunnen visibility updaten
CREATE POLICY "Admins can update job visibility"
  ON public.job_visibility
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Alleen admins kunnen visibility verwijderen
CREATE POLICY "Admins can delete job visibility"
  ON public.job_visibility
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Trigger voor updated_at
CREATE TRIGGER update_job_visibility_updated_at
  BEFORE UPDATE ON public.job_visibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Initial Admin Users Setup
-- ============================================
-- Let op: Deze moeten handmatig worden ingevuld na het aanmaken van de users in Supabase Auth
-- Vervang 'admin1@example.com' en 'admin2@example.com' met de echte admin email adressen

-- Voorbeeld (uncomment en pas aan na user creation):
-- INSERT INTO public.user_roles (user_id, email, role)
-- SELECT id, 'admin1@example.com', 'admin'
-- FROM auth.users
-- WHERE email = 'admin1@example.com'
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO public.user_roles (user_id, email, role)
-- SELECT id, 'admin2@example.com', 'admin'
-- FROM auth.users
-- WHERE email = 'admin2@example.com'
-- ON CONFLICT (email) DO NOTHING;

