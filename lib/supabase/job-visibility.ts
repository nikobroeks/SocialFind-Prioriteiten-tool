import { createClient } from '@/lib/supabase/server';

export interface JobVisibility {
  id: string;
  recruitee_job_id: number;
  recruitee_company_id: number;
  company_name: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get visibility settings for all jobs
 */
export async function getAllJobVisibility(): Promise<JobVisibility[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('job_visibility')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching job visibility:', error);
    return [];
  }

  return (data || []) as JobVisibility[];
}

/**
 * Get visibility for a specific job
 */
export async function getJobVisibility(
  jobId: number,
  companyId: number
): Promise<JobVisibility | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('job_visibility')
    .select('*')
    .eq('recruitee_job_id', jobId)
    .eq('recruitee_company_id', companyId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching job visibility:', error);
    return null;
  }

  return data as JobVisibility | null;
}

/**
 * Set visibility for a job
 */
export async function setJobVisibility(
  jobId: number,
  companyId: number,
  companyName: string,
  isVisible: boolean
): Promise<JobVisibility> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('job_visibility')
    .upsert({
      recruitee_job_id: jobId,
      recruitee_company_id: companyId,
      company_name: companyName,
      is_visible: isVisible,
      updated_by: user?.id,
    } as any, {
      onConflict: 'recruitee_job_id,recruitee_company_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error setting job visibility:', error);
    throw error;
  }

  return data as JobVisibility;
}

/**
 * Set visibility for multiple jobs at once (by company)
 */
export async function setCompanyJobsVisibility(
  companyName: string,
  companyId: number,
  jobIds: number[],
  isVisible: boolean
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const visibilityData = jobIds.map(jobId => ({
    recruitee_job_id: jobId,
    recruitee_company_id: companyId,
    company_name: companyName,
    is_visible: isVisible,
    updated_by: user?.id,
  }));

  const { error } = await supabase
    .from('job_visibility')
    .upsert(visibilityData as any, {
      onConflict: 'recruitee_job_id,recruitee_company_id',
    });

  if (error) {
    console.error('Error setting company jobs visibility:', error);
    throw error;
  }
}
