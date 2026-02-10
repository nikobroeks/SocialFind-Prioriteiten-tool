-- Migration: Create known_companies table
-- This table stores the list of known/recognized companies
-- This allows dynamic addition of companies without code changes

-- Step 1: Create known_companies table
CREATE TABLE IF NOT EXISTS public.known_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_known_companies_name ON public.known_companies(company_name);

-- Step 3: Enable RLS
ALTER TABLE public.known_companies ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
CREATE POLICY "Authenticated users can view known companies"
  ON public.known_companies
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert known companies"
  ON public.known_companies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update known companies"
  ON public.known_companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete known companies"
  ON public.known_companies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Step 5: Insert initial known companies
INSERT INTO public.known_companies (company_name) VALUES
  ('Kader Group'),
  ('Vacumetal'),
  ('Don Bureau'),
  ('Bosch Beton'),
  ('Bouwgroep Peters'),
  ('GB-Meubelen'),
  ('CANNA'),
  ('Circus Gran Casino'),
  ('De Groot Bewerkingsmachines'),
  ('HQ Pack'),
  ('KIS Group'),
  ('Kragten'),
  ('Methorst'),
  ('Mosadex'),
  ('NIRAS'),
  ('Noverno'),
  ('Onestein'),
  ('Owow'),
  ('Pelgrimshof'),
  ('Pergamijn'),
  ('PPT'),
  ('Rioned'),
  ('Seerden'),
  ('Siebers'),
  ('SocialFind'),
  ('Taxperience'),
  ('thyssenkrupp'),
  ('Trappenfabriek Vermeulen'),
  ('Ugoo'),
  ('Van de Reijt Meststoffen'),
  ('Van Heek Medical'),
  ('Van Wijnen'),
  ('Waterschap Aa en Maas'),
  ('Waterschap de Brabantse Delta'),
  ('Waterschap De Dommel'),
  ('Willy Naessens')
ON CONFLICT (company_name) DO NOTHING;

-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_known_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_known_companies_updated_at
  BEFORE UPDATE ON public.known_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_known_companies_updated_at();

