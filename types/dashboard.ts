/**
 * Combined types voor het Dashboard
 * Deze types combineren Recruitee data met lokale prioriteits data
 */

import { RecruiteeJob, RecruiteeCompany, SilverMedalistCandidate } from './recruitee';
import { VacancyPriority } from './database';

// Re-export PriorityColor voor gebruik in andere bestanden
export type PriorityColor = 'Red' | 'Orange' | 'Green';

export interface VacancyWithPriority {
  // Recruitee data
  job: RecruiteeJob;
  company: RecruiteeCompany;
  
  // Lokale prioriteits data (kan null zijn als nog niet ingesteld)
  priority: VacancyPriority | null;
  
  // Berekende display priority (gebruikt manual_override als die bestaat, anders calculated_priority)
  displayPriority: PriorityColor;
  
  // Optional: Suggested candidates from talent pool goldmining
  suggestedCandidates?: SilverMedalistCandidate[];
}

export interface CompanyGroup {
  company: RecruiteeCompany;
  vacancies: VacancyWithPriority[];
  companyPriority?: PriorityColor; // Hoogste priority van alle vacatures binnen dit bedrijf
}

import { ClientPainLevel, TimeCriticality, StrategicValue, AccountHealth } from './database';

export interface PriorityFormData {
  // Nieuwe 4 pijlers
  client_pain_level: ClientPainLevel | null;
  time_criticality: TimeCriticality | null;
  strategic_value: StrategicValue | null;
  account_health: AccountHealth | null;
  
  manual_override: PriorityColor | null;
  notes: string | null;
}

