/**
 * Supabase database queries voor vacancy priorities
 */

import { supabase } from './client';
import { VacancyPriority } from '@/types/database';
import { PriorityFormData } from '@/types/dashboard';
import { calculatePriority } from '@/lib/utils';

/**
 * Haalt alle prioriteiten op
 */
export async function getAllPriorities(): Promise<VacancyPriority[]> {
  const { data, error } = await supabase
    .from('vacancy_priorities')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching priorities: ${error.message}`);
  }

  return data || [];
}

/**
 * Haalt prioriteit op voor een specifieke vacature
 */
export async function getPriorityByJobId(
  jobId: number,
  companyId: number
): Promise<VacancyPriority | null> {
  const { data, error } = await supabase
    .from('vacancy_priorities')
    .select('*')
    .eq('recruitee_job_id', jobId)
    .eq('recruitee_company_id', companyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Error fetching priority: ${error.message}`);
  }

  return data;
}

/**
 * Creëert of update een prioriteit
 */
export async function upsertPriority(
  jobId: number,
  companyId: number,
  formData: PriorityFormData
): Promise<VacancyPriority> {
  // Bereken de calculated priority op basis van de 4 pijlers
  const calculatedPriority = calculatePriority(
    formData.client_pain_level,
    formData.time_criticality,
    formData.strategic_value,
    formData.account_health
  );

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const priorityData = {
    recruitee_job_id: jobId,
    recruitee_company_id: companyId,
    // Nieuwe 4 pijlers
    client_pain_level: formData.client_pain_level,
    time_criticality: formData.time_criticality,
    strategic_value: formData.strategic_value,
    account_health: formData.account_health,
    calculated_priority: calculatedPriority,
    manual_override: formData.manual_override,
    notes: formData.notes,
    updated_by: userId || null,
  };

  const { data, error } = await (supabase.from('vacancy_priorities') as any)
    .upsert(priorityData, {
      onConflict: 'recruitee_job_id,recruitee_company_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error upserting priority: ${error.message}`);
  }

  return data;
}

/**
 * Verwijdert een prioriteit
 */
export async function deletePriority(
  jobId: number,
  companyId: number
): Promise<void> {
  const { error } = await supabase
    .from('vacancy_priorities')
    .delete()
    .eq('recruitee_job_id', jobId)
    .eq('recruitee_company_id', companyId);

  if (error) {
    throw new Error(`Error deleting priority: ${error.message}`);
  }
}

/**
 * Haalt de rol van de huidige gebruiker op
 */
export async function getUserRole(): Promise<'admin' | 'viewer' | null> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user?.id) {
    return null;
  }

  const { data, error } = await (supabase.from('user_roles') as any)
    .select('role')
    .eq('user_id', userData.user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as any).role as 'admin' | 'viewer';
}

/**
 * Haalt de collapse state op voor alle bedrijven van een gebruiker
 */
export async function getUserCompanyCollapseState(
  userId: string
): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('user_company_collapse_state')
    .select('recruitee_company_id, company_name, is_collapsed')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching collapse state:', error);
    return {};
  }

  // Convert array to record: { "companyId-companyName": isCollapsed }
  const collapseState: Record<string, boolean> = {};
  (data || []).forEach((row: any) => {
    const key = `${row.recruitee_company_id}-${row.company_name}`;
    collapseState[key] = row.is_collapsed;
  });

  return collapseState;
}

/**
 * Stelt de collapse state in voor een specifiek bedrijf
 */
export async function setCompanyCollapseState(
  userId: string,
  companyId: number,
  companyName: string,
  isCollapsed: boolean
): Promise<void> {
  const { error } = await (supabase.from('user_company_collapse_state') as any)
    .upsert({
      user_id: userId,
      recruitee_company_id: companyId,
      company_name: companyName,
      is_collapsed: isCollapsed,
    }, {
      onConflict: 'user_id,recruitee_company_id,company_name',
    });

  if (error) {
    throw new Error(`Error setting collapse state: ${error.message}`);
  }
}

/**
 * Haalt recruiter en buddy op voor een bedrijf
 */
export async function getCompanyRecruiters(
  companyId: number,
  companyName: string
): Promise<{ recruiter: string | null; buddy: string | null } | null> {
  const { data, error } = await supabase
    .from('company_recruiters')
    .select('recruiter, buddy')
    .eq('recruitee_company_id', companyId)
    .eq('company_name', companyName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Error fetching company recruiters: ${error.message}`);
  }

  return {
    recruiter: data?.recruiter || null,
    buddy: data?.buddy || null,
  };
}

/**
 * Stelt recruiter en buddy in voor een bedrijf
 */
export async function setCompanyRecruiters(
  companyId: number,
  companyName: string,
  recruiter: string | null,
  buddy: string | null
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { error } = await (supabase.from('company_recruiters') as any)
    .upsert({
      recruitee_company_id: companyId,
      company_name: companyName,
      recruiter: recruiter || null,
      buddy: buddy || null,
      updated_by: userId || null,
    }, {
      onConflict: 'recruitee_company_id,company_name',
    });

  if (error) {
    throw new Error(`Error setting company recruiters: ${error.message}`);
  }
}

