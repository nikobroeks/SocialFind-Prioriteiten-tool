import { createClient } from '@/lib/supabase/server';

export interface KnownCompany {
  id: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * Get all known companies from database
 */
export async function getAllKnownCompanies(): Promise<KnownCompany[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('known_companies')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching known companies:', error);
    return [];
  }

  return (data || []) as KnownCompany[];
}

/**
 * Add a company to the known companies list
 */
export async function addKnownCompany(companyName: string): Promise<KnownCompany> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await (supabase
    .from('known_companies') as any)
    .insert({
      company_name: companyName.trim(),
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding known company:', error);
    throw error;
  }

  return data as KnownCompany;
}

/**
 * Check if a company is in the known companies list
 */
export async function isKnownCompany(companyName: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('known_companies')
    .select('id')
    .eq('company_name', companyName.trim())
    .maybeSingle();

  if (error) {
    console.error('Error checking known company:', error);
    return false;
  }

  return !!data;
}

