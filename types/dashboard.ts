/**
 * Combined types voor het Dashboard
 * Deze types combineren Recruitee data met lokale prioriteits data
 */

import { RecruiteeJob, RecruiteeCompany } from './recruitee';
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
}

export interface CompanyGroup {
  company: RecruiteeCompany;
  vacancies: VacancyWithPriority[];
  companyPriority?: PriorityColor; // Hoogste priority van alle vacatures binnen dit bedrijf
}

export interface PriorityFormData {
  strategy_score: 'Key Account' | 'Longterm' | 'Ad-hoc' | null;
  hiring_chance: 'High' | 'Medium' | 'Low' | null;
  client_pain: boolean;
  manual_override: PriorityColor | null;
  notes: string | null;
}

