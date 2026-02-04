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

export interface UserRoleRow {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'viewer';
  created_at: string;
  updated_at: string;
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
        Update: Partial<Omit<UserRoleRow, 'id' | 'created_at'>>;
      };
    };
  };
}

