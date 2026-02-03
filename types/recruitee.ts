/**
 * TypeScript interfaces voor Recruitee API data
 * Deze types representeren de externe API response
 */

export interface RecruiteeJob {
  id: number;
  title: string;
  status: string;
  company_id: number;
  company_string_id?: string; // Voor groepering op klantbedrijf naam
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

export interface RecruiteeCandidate {
  id: number;
  name: string;
  emails?: string[];
  phones?: string[];
  created_at: string;
  updated_at: string;
  hired_at?: string; // Datum wanneer candidate is aangenomen
  offer_id?: number; // ID van de vacature waar deze candidate voor is aangenomen
  stage?: {
    id: number;
    name: string;
    category?: string; // Bijv. "hire" voor aangenomen candidates
  };
  [key: string]: unknown;
}

export interface RecruiteeCandidatesResponse {
  candidates?: RecruiteeCandidate[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}
