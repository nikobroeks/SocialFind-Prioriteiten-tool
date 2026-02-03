/**
 * TypeScript interfaces voor Recruitee API data
 * Deze types representeren de externe API response
 */

export interface RecruiteeJob {
  id: number;
  title: string;
  status: string;
  company_id: number;
  company?: RecruiteeCompany;
  created_at: string;
  updated_at: string;
  // Voeg andere relevante velden toe op basis van je Recruitee API response
  [key: string]: unknown;
}

export interface RecruiteeCompany {
  id: number;
  name: string;
  slug?: string;
  website?: string;
  // Voeg andere relevante velden toe
  [key: string]: unknown;
}

export interface RecruiteeApiResponse {
  offers?: RecruiteeJob[]; // Recruitee gebruikt "offers" voor jobs
  jobs?: RecruiteeJob[]; // Fallback voor andere formats
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

