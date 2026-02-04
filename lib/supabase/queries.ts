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

