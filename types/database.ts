/**
 * TypeScript interfaces voor Supabase database types
 * Deze types komen overeen met het SQL schema
 */

// Oude types (voor backward compatibility tijdens migratie)
export type StrategyScore = 'Key Account' | 'Longterm' | 'Ad-hoc';
export type HiringChance = 'High' | 'Medium' | 'Low';

// Nieuwe types voor 4 pijlers
export type ClientPainLevel = 'Nee' | 'Beginnend' | 'Ja';
export type TimeCriticality = 'Net begonnen' | 'Lopend' | 'Tegen het einde van samenwerking';
export type StrategicValue = 'C-klant' | 'B-klant' | 'A-klant';
export type AccountHealth = 'Tevreden stakeholder' | 'Onrustige stakeholder' | 'Kans op churn';

export type PriorityColor = 'Red' | 'Orange' | 'Green';
export type UserRole = 'admin' | 'viewer';

export interface VacancyPriority {
  id: string;
  recruitee_job_id: number;
  recruitee_company_id: number;
  
  // Nieuwe 4 pijlers
  client_pain_level: ClientPainLevel | null;
  time_criticality: TimeCriticality | null;
  strategic_value: StrategicValue | null;
  account_health: AccountHealth | null;
  
  // Oude velden (voor backward compatibility - kunnen later verwijderd worden)
  strategy_score?: StrategyScore | null;
  hiring_chance?: HiringChance | null;
  client_pain?: boolean;
  
  calculated_priority: PriorityColor;
  manual_override: PriorityColor | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface CompanyVisibility {
  id: string;
  recruitee_company_id: number;
  company_name: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface KnownCompany {
  id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CompanyHours {
  id: string;
  recruitee_company_id: number;
  company_name: string;
  total_hours: number;
  spent_hours: number;
  week_start_date: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface Database {
  public: {
    Tables: {
      vacancy_priorities: {
        Row: VacancyPriority;
        Insert: Omit<VacancyPriority, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<VacancyPriority, 'id' | 'created_at'>>;
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: Omit<UserRoleRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserRoleRow, 'id' | 'created_at' | 'updated_at'>>;
      };
      company_visibility: {
        Row: CompanyVisibility;
        Insert: Omit<CompanyVisibility, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CompanyVisibility, 'id' | 'created_at'>>;
      };
      known_companies: {
        Row: KnownCompany;
        Insert: Omit<KnownCompany, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<KnownCompany, 'id' | 'created_at'>>;
      };
      company_hours: {
        Row: CompanyHours;
        Insert: Omit<CompanyHours, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CompanyHours, 'id' | 'created_at'>>;
      };
    };
  };
}

