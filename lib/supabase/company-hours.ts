import { createClient } from '@/lib/supabase/server';

export interface CompanyHours {
  id: string;
  recruitee_company_id: number;
  company_name: string;
  total_hours: number;
  spent_hours: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Get hours for all companies
 */
export async function getAllCompanyHours(): Promise<CompanyHours[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('company_hours')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching company hours:', error);
    return [];
  }

  return (data || []) as CompanyHours[];
}

/**
 * Get hours for a specific company
 */
export async function getCompanyHours(
  companyId: number,
  companyName: string
): Promise<CompanyHours | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('company_hours')
    .select('*')
    .eq('recruitee_company_id', companyId)
    .eq('company_name', companyName)
    .maybeSingle();

  if (error) {
    console.error('Error fetching company hours:', error);
    return null;
  }

  return data as CompanyHours | null;
}

/**
 * Set hours for a company
 */
export async function setCompanyHours(
  companyId: number,
  companyName: string,
  totalHours: number,
  spentHours: number
): Promise<CompanyHours> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('company_hours')
    .upsert({
      recruitee_company_id: companyId,
      company_name: companyName,
      total_hours: totalHours,
      spent_hours: spentHours,
      updated_by: user?.id,
    } as any, {
      onConflict: 'recruitee_company_id,company_name',
    })
    .select()
    .single();

  if (error) {
    console.error('Error setting company hours:', error);
    throw error;
  }

  return data as CompanyHours;
}

/**
 * Calculate remaining hours
 */
export function calculateRemainingHours(totalHours: number, spentHours: number): number {
  return Math.max(0, totalHours - spentHours);
}

