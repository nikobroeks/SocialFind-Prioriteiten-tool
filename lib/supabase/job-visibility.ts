import { createClient } from '@/lib/supabase/client';

export interface JobVisibility {
  id: string;
  recruitee_job_id: number;
  recruitee_company_id: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Haalt alle job visibility settings op
 */
export async function getAllJobVisibility(): Promise<JobVisibility[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('job_visibility')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching job visibility:', error);
    throw error;
  }

  return (data || []) as JobVisibility[];
}

/**
 * Haalt visibility op voor een specifieke job
 */
export async function getJobVisibility(
  jobId: number,
  companyId: number
): Promise<JobVisibility | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('job_visibility')
    .select('*')
    .eq('recruitee_job_id', jobId)
    .eq('recruitee_company_id', companyId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching job visibility:', error);
    throw error;
  }

  return data as JobVisibility | null;
}

/**
 * Update of insert job visibility
 */
export async function upsertJobVisibility(
  jobId: number,
  companyId: number,
  isVisible: boolean
): Promise<JobVisibility> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('job_visibility')
    .upsert({
      recruitee_job_id: jobId,
      recruitee_company_id: companyId,
      is_visible: isVisible,
      updated_by: user.id,
    } as any, {
      onConflict: 'recruitee_job_id,recruitee_company_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting job visibility:', error);
    throw error;
  }

  return data as JobVisibility;
}

/**
 * Bulk update job visibility voor meerdere jobs
 */
export async function bulkUpdateJobVisibility(
  updates: Array<{ jobId: number; companyId: number; isVisible: boolean }>
): Promise<void> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Upsert alle updates
  const upserts = updates.map(update => ({
    recruitee_job_id: update.jobId,
    recruitee_company_id: update.companyId,
    is_visible: update.isVisible,
    updated_by: user.id,
  }));

  const { error } = await supabase
    .from('job_visibility')
    .upsert(upserts as any, {
      onConflict: 'recruitee_job_id,recruitee_company_id',
    });

  if (error) {
    console.error('Error bulk updating job visibility:', error);
    throw error;
  }
}

