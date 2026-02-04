-- Migration: Update vacancy_priorities table to use 4 pillars instead of 3
-- Voer dit uit in Supabase SQL Editor

-- Stap 1: Voeg nieuwe kolommen toe
ALTER TABLE public.vacancy_priorities
  ADD COLUMN IF NOT EXISTS client_pain_level TEXT CHECK (client_pain_level IN ('Nee', 'Beginnend', 'Ja')),
  ADD COLUMN IF NOT EXISTS time_criticality TEXT CHECK (time_criticality IN ('Net begonnen', 'Lopend', 'Tegen het einde van samenwerking')),
  ADD COLUMN IF NOT EXISTS strategic_value TEXT CHECK (strategic_value IN ('C-klant', 'B-klant', 'A-klant')),
  ADD COLUMN IF NOT EXISTS account_health TEXT CHECK (account_health IN ('Tevreden stakeholder', 'Onrustige stakeholder', 'Kans op churn'));

-- Stap 2: Migreer bestaande data (optioneel - converteer oude waarden naar nieuwe)
-- Oude client_pain boolean -> client_pain_level
UPDATE public.vacancy_priorities
SET client_pain_level = CASE 
  WHEN client_pain = true THEN 'Ja'
  WHEN client_pain = false THEN 'Nee'
  ELSE 'Nee'  -- Default voor NULL
END
WHERE client_pain_level IS NULL AND client_pain IS NOT NULL;

-- Oude strategy_score -> strategic_value (ongeveer)
UPDATE public.vacancy_priorities
SET strategic_value = CASE
  WHEN strategy_score = 'Key Account' THEN 'A-klant'
  WHEN strategy_score = 'Longterm' THEN 'B-klant'
  WHEN strategy_score = 'Ad-hoc' THEN 'C-klant'
  ELSE NULL
END
WHERE strategic_value IS NULL AND strategy_score IS NOT NULL;

-- Oude hiring_chance -> time_criticality (ongeveer)
-- High = Tegen het einde, Medium = Lopend, Low = Net begonnen
UPDATE public.vacancy_priorities
SET time_criticality = CASE
  WHEN hiring_chance = 'High' THEN 'Tegen het einde van samenwerking'
  WHEN hiring_chance = 'Medium' THEN 'Lopend'
  WHEN hiring_chance = 'Low' THEN 'Net begonnen'
  ELSE NULL
END
WHERE time_criticality IS NULL AND hiring_chance IS NOT NULL;

-- Note: account_health heeft geen oude equivalent, moet handmatig worden ingevuld

-- Stap 3: Verwijder oude kolommen (pas op: dit verwijdert data!)
-- ALTER TABLE public.vacancy_priorities
--   DROP COLUMN IF EXISTS strategy_score,
--   DROP COLUMN IF EXISTS hiring_chance,
--   DROP COLUMN IF EXISTS client_pain;

-- Stap 4: Herbereken alle prioriteiten met nieuwe logica
-- (Dit moet via de applicatie gebeuren, niet via SQL)

-- Verifieer dat de kolommen zijn toegevoegd
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'vacancy_priorities'
  AND column_name IN ('client_pain_level', 'time_criticality', 'strategic_value', 'account_health')
ORDER BY column_name;

-- Verifieer de nieuwe structuur met data
SELECT 
  id,
  recruitee_job_id,
  client_pain_level,
  time_criticality,
  strategic_value,
  account_health,
  calculated_priority,
  manual_override,
  -- Oude velden (voor verificatie)
  client_pain,
  strategy_score,
  hiring_chance
FROM public.vacancy_priorities
ORDER BY updated_at DESC
LIMIT 10;

