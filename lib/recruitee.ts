/**
 * Recruitee API client
 * Haalt vacatures op via de Recruitee API
 * 
 * Let op: Deze functies worden alleen server-side aangeroepen (API routes)
 */

import { RecruiteeApiResponse, RecruiteeJob, RecruiteeCompany } from '@/types/recruitee';

const RECRUITEE_API_KEY = process.env.RECRUITEE_API_KEY;
const RECRUITEE_COMPANY_ID = process.env.RECRUITEE_COMPANY_ID;
const RECRUITEE_API_BASE_URL = 'https://api.recruitee.com';

if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
  console.warn('Recruitee API credentials not configured');
}

interface FetchJobsOptions {
  status?: string;
  page?: number;
  perPage?: number;
}

/**
 * Haalt vacatures op van Recruitee API
 * Filtert automatisch op status 'published'
 */
export async function fetchRecruiteeJobs(
  options: FetchJobsOptions = {}
): Promise<RecruiteeJob[]> {
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    throw new Error('Recruitee API credentials not configured');
  }

  const { status = 'published', page = 1, perPage = 100 } = options;

  try {
    // Recruitee API kan verschillende endpoint formats hebben:
    // 1. /c/{company_id}/jobs
    // 2. /companies/{company_id}/jobs  
    // 3. /jobs (met company_id in header of query)
    
    // Recruitee gebruikt "offers" endpoint, niet "jobs"
    const url = `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers?status=${status}&page=${page}&per_page=${perPage}`;
    
    console.log('Recruitee API Request:', {
      url: url.replace(RECRUITEE_API_KEY!, '***'),
      companyId: RECRUITEE_COMPANY_ID,
      hasApiKey: !!RECRUITEE_API_KEY,
    });

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recruitee API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Recruitee API error: ${response.status} ${response.statusText}. ${errorText.substring(0, 200)}`);
    }

    const responseData = await response.json();
    
    // Recruitee API response format: { meta: {...}, offers: [...] }
    // "offers" zijn de jobs/vacatures
    let jobs: RecruiteeJob[] = [];
    
    if (Array.isArray(responseData)) {
      jobs = responseData;
    } else if (responseData.offers) {
      // Recruitee gebruikt "offers" voor jobs
      jobs = responseData.offers;
    } else if (responseData.jobs) {
      jobs = responseData.jobs;
    } else if (responseData.data?.offers) {
      jobs = responseData.data.offers;
    } else if (responseData.data?.jobs) {
      jobs = responseData.data.jobs;
    }
    
    // Log voor debugging
    console.log('Recruitee API response structure:', {
      responseType: Array.isArray(responseData) ? 'array' : typeof responseData,
      hasOffers: !!responseData.offers,
      hasJobs: !!responseData.jobs,
      totalJobs: jobs.length,
      firstJob: jobs[0] ? {
        id: jobs[0].id,
        title: jobs[0].title,
        company_id: jobs[0].company_id,
        hasCompany: !!jobs[0].company,
        company: jobs[0].company,
        allKeys: Object.keys(jobs[0])
      } : null
    });
    
    // Recruitee "offers" hebben mogelijk geen direct company_id veld
    // We moeten company data uit andere bronnen halen of een fallback gebruiken
    // Voor nu gebruiken we de company_id uit de URL (RECRUITEE_COMPANY_ID)
    // omdat alle offers van hetzelfde bedrijf zijn
    const enrichedJobs = jobs.map((job: any) => {
      // Check of er al company data is
      if (job.company) {
        return {
          ...job,
          company_id: job.company.id || job.company_id || parseInt(RECRUITEE_COMPANY_ID!),
        };
      }
      
      // Probeer company_id uit verschillende velden
      const companyId = job.company_id || 
                       job.companyId || 
                       job.department?.company_id ||
                       parseInt(RECRUITEE_COMPANY_ID!); // Fallback naar de company ID uit de URL
      
      // Probeer company naam uit verschillende velden
      const companyName = job.company?.name ||
                         job.company_name || 
                         job.companyName ||
                         job.department?.company?.name ||
                         'SocialFind'; // Fallback naam
      
      return {
        ...job,
        company_id: companyId,
        company: {
          id: companyId,
          name: companyName,
        }
      };
    });
    
    return enrichedJobs;
  } catch (error) {
    console.error('Error fetching Recruitee jobs:', error);
    throw error;
  }
}

/**
 * Haalt een specifieke vacature op
 */
export async function fetchRecruiteeJob(jobId: number): Promise<RecruiteeJob | null> {
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    throw new Error('Recruitee API credentials not configured');
  }

  try {
    // Gebruik "offers" endpoint in plaats van "jobs"
    const response = await fetch(
      `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers/${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Recruitee API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching Recruitee job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Haalt companies op van Recruitee API (als beschikbaar)
 * Let op: Dit endpoint bestaat mogelijk niet in alle Recruitee accounts
 */
export async function fetchRecruiteeCompanies(): Promise<RecruiteeCompany[]> {
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    throw new Error('Recruitee API credentials not configured');
  }

  try {
    // Probeer eerst het companies endpoint
    const response = await fetch(
      `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/companies`,
      {
        headers: {
          'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Als endpoint niet bestaat, return lege array
      if (response.status === 404) {
        console.warn('Recruitee companies endpoint not available');
        return [];
      }
      throw new Error(`Recruitee API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Mogelijke response formats:
    // { companies: [...] } of direct array
    return Array.isArray(data) ? data : data.companies || [];
  } catch (error) {
    console.error('Error fetching Recruitee companies:', error);
    // Return lege array in plaats van error te gooien
    return [];
  }
}

