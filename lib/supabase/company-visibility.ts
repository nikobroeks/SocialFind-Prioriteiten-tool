import { createClient } from '@/lib/supabase/server';

export interface CompanyVisibility {
  id: string;
  recruitee_company_id: number;
  company_name: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get visibility settings for all companies
 */
export async function getAllCompanyVisibility(): Promise<CompanyVisibility[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('company_visibility')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching company visibility:', error);
    return [];
  }

  return (data || []) as CompanyVisibility[];
}

/**
 * Get visibility for a specific company
 */
export async function getCompanyVisibility(
  companyId: number,
  companyName: string
): Promise<CompanyVisibility | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('company_visibility')
    .select('*')
    .eq('recruitee_company_id', companyId)
    .eq('company_name', companyName)
    .maybeSingle();

  if (error) {
    console.error('Error fetching company visibility:', error);
    return null;
  }

  return data as CompanyVisibility | null;
}

/**
 * Set visibility for a company
 */
export async function setCompanyVisibility(
  companyId: number,
  companyName: string,
  isVisible: boolean
): Promise<CompanyVisibility> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('company_visibility')
    .upsert({
      recruitee_company_id: companyId,
      company_name: companyName,
      is_visible: isVisible,
      updated_by: user?.id,
    } as any, {
      onConflict: 'recruitee_company_id,company_name',
    })
    .select()
    .single();

  if (error) {
    console.error('Error setting company visibility:', error);
    throw error;
  }

  return data as CompanyVisibility;
}

