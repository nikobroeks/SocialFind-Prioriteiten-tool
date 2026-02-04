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
  ELSE 'Nee'
END
WHERE client_pain_level IS NULL;

-- Oude strategy_score -> strategic_value (ongeveer)
UPDATE public.vacancy_priorities
SET strategic_value = CASE
  WHEN strategy_score = 'Key Account' THEN 'A-klant'
  WHEN strategy_score = 'Longterm' THEN 'B-klant'
  WHEN strategy_score = 'Ad-hoc' THEN 'C-klant'
  ELSE NULL
END
WHERE strategic_value IS NULL AND strategy_score IS NOT NULL;

-- Stap 3: Verwijder oude kolommen (pas op: dit verwijdert data!)
-- ALTER TABLE public.vacancy_priorities
--   DROP COLUMN IF EXISTS strategy_score,
--   DROP COLUMN IF EXISTS hiring_chance,
--   DROP COLUMN IF EXISTS client_pain;

-- Stap 4: Herbereken alle prioriteiten met nieuwe logica
-- (Dit moet via de applicatie gebeuren, niet via SQL)

-- Verifieer de nieuwe structuur
SELECT 
  id,
  recruitee_job_id,
  client_pain_level,
  time_criticality,
  strategic_value,
  account_health,
  calculated_priority,
  manual_override
FROM public.vacancy_priorities
LIMIT 5;

