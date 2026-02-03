/**
 * TypeScript interfaces voor Supabase database types
 * Deze types komen overeen met het SQL schema
 */

export type StrategyScore = 'Key Account' | 'Longterm' | 'Ad-hoc';
export type HiringChance = 'High' | 'Medium' | 'Low';
export type PriorityColor = 'Red' | 'Orange' | 'Green';
export type UserRole = 'admin' | 'viewer';

export interface VacancyPriority {
  id: string;
  recruitee_job_id: number;
  recruitee_company_id: number;
  strategy_score: StrategyScore | null;
  hiring_chance: HiringChance | null;
  client_pain: boolean;
  calculated_priority: PriorityColor;
  manual_override: PriorityColor | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface JobVisibility {
  id: string;
  recruitee_job_id: number;
  recruitee_company_id: number;
  is_visible: boolean;
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
        Row: UserRole;
        Insert: Omit<UserRole, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserRole, 'id' | 'created_at'>>;
      };
      job_visibility: {
        Row: JobVisibility;
        Insert: Omit<JobVisibility, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<JobVisibility, 'id' | 'created_at'>>;
      };
    };
  };
}

