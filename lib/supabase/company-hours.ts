import { createClient } from '@/lib/supabase/server';

export interface CompanyHours {
  id: string;
  recruitee_company_id: number;
  company_name: string;
  total_hours: number;
  spent_hours: number;
  week_start_date: string; // ISO date string (YYYY-MM-DD) for Monday of the week
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Get the Monday (start of week) for a given date
 * Weeks start on Monday (ISO 8601)
 */
export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Get the previous week's Monday
 */
export function getPreviousWeekStartDate(date: Date = new Date()): string {
  const currentWeekStart = new Date(getWeekStartDate(date));
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  return currentWeekStart.toISOString().split('T')[0];
}

/**
 * Get hours for all companies for a specific week
 */
export async function getAllCompanyHours(weekStartDate?: string): Promise<CompanyHours[]> {
  const supabase = await createClient();
  const weekStart = weekStartDate || getWeekStartDate();
  
  const { data, error } = await supabase
    .from('company_hours')
    .select('*')
    .eq('week_start_date', weekStart)
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching company hours:', error);
    return [];
  }

  return (data || []) as CompanyHours[];
}

/**
 * Get hours for all companies for current and previous week
 */
export async function getAllCompanyHoursForWeeks(): Promise<{
  currentWeek: CompanyHours[];
  previousWeek: CompanyHours[];
}> {
  const currentWeekStart = getWeekStartDate();
  const previousWeekStart = getPreviousWeekStartDate();
  
  const [currentWeek, previousWeek] = await Promise.all([
    getAllCompanyHours(currentWeekStart),
    getAllCompanyHours(previousWeekStart),
  ]);

  return {
    currentWeek,
    previousWeek,
  };
}

/**
 * Get hours for a specific company for a specific week
 */
export async function getCompanyHours(
  companyId: number,
  companyName: string,
  weekStartDate?: string
): Promise<CompanyHours | null> {
  const supabase = await createClient();
  const weekStart = weekStartDate || getWeekStartDate();
  
  const { data, error } = await supabase
    .from('company_hours')
    .select('*')
    .eq('recruitee_company_id', companyId)
    .eq('company_name', companyName)
    .eq('week_start_date', weekStart)
    .maybeSingle();

  if (error) {
    console.error('Error fetching company hours:', error);
    return null;
  }

  return data as CompanyHours | null;
}

/**
 * Get hours for a specific company for current and previous week
 */
export async function getCompanyHoursForWeeks(
  companyId: number,
  companyName: string
): Promise<{
  currentWeek: CompanyHours | null;
  previousWeek: CompanyHours | null;
}> {
  const currentWeekStart = getWeekStartDate();
  const previousWeekStart = getPreviousWeekStartDate();
  
  const [currentWeek, previousWeek] = await Promise.all([
    getCompanyHours(companyId, companyName, currentWeekStart),
    getCompanyHours(companyId, companyName, previousWeekStart),
  ]);

  return {
    currentWeek,
    previousWeek,
  };
}

/**
 * Set hours for a company for a specific week
 */
export async function setCompanyHours(
  companyId: number,
  companyName: string,
  totalHours: number,
  spentHours: number,
  weekStartDate?: string
): Promise<CompanyHours> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const weekStart = weekStartDate || getWeekStartDate();

  const { data, error } = await (supabase
    .from('company_hours') as any)
    .upsert({
      recruitee_company_id: companyId,
      company_name: companyName,
      week_start_date: weekStart,
      total_hours: totalHours,
      spent_hours: spentHours,
      updated_by: user?.id,
    }, {
      onConflict: 'recruitee_company_id,company_name,week_start_date',
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

