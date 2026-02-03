/**
 * Recruitee API client
 * Haalt vacatures op via de Recruitee API
 * 
 * Let op: Deze functies worden alleen server-side aangeroepen (API routes)
 */

import { 
  RecruiteeApiResponse, 
  RecruiteeJob, 
  RecruiteeCompany,
  RecruiteeCandidate,
  RecruiteeCandidatesResponse
} from '@/types/recruitee';
import { extractCompanyFromTitle, getCompanyId } from './company-extractor';

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
      // EERST proberen uit de titel te halen (klantbedrijf)
      const companyNameFromTitle = extractCompanyFromTitle(job.title || '');
      
      const companyName = companyNameFromTitle !== 'Onbekend Bedrijf' 
        ? companyNameFromTitle
        : job.company?.name ||
          job.company_name || 
          job.companyName ||
          job.department?.company?.name ||
          'Onbekend Bedrijf'; // Fallback naam
      
      // Gebruik een string ID voor de company (op basis van naam) voor groepering
      const companyStringId = getCompanyId(companyName);
      
      return {
        ...job,
        company_id: companyId,
        // Gebruik de string ID als unieke identifier voor groepering
        company_string_id: companyStringId,
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

/**
 * Haalt candidates op van Recruitee API
 * Kan gefilterd worden op stage (bijv. "hire" voor aangenomen candidates)
 */
export async function fetchRecruiteeCandidates(options: {
  stage?: string;
  offerId?: number;
  page?: number;
  perPage?: number;
} = {}): Promise<RecruiteeCandidate[]> {
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    throw new Error('Recruitee API credentials not configured');
  }

  const { stage, offerId, page = 1, perPage = 100 } = options;

  try {
    let url = `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/candidates?page=${page}&per_page=${perPage}`;
    
    if (stage) {
      url += `&stage=${stage}`;
    }
    if (offerId) {
      url += `&offer_id=${offerId}`;
    }

    console.log('Recruitee API Request (Candidates):', {
      url: url.replace(RECRUITEE_API_KEY!, '***'),
      stage,
      offerId,
    });

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recruitee API Error (Candidates):', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      // Als endpoint niet bestaat, return lege array
      if (response.status === 404) {
        console.warn('Recruitee candidates endpoint not available');
        return [];
      }
      
      throw new Error(`Recruitee API error: ${response.status} ${response.statusText}. ${errorText.substring(0, 200)}`);
    }

    const responseData: RecruiteeCandidatesResponse = await response.json();
    
    let candidates: RecruiteeCandidate[] = [];
    
    if (Array.isArray(responseData)) {
      candidates = responseData;
    } else if (responseData.candidates) {
      candidates = responseData.candidates;
    } else if ((responseData as any).data?.candidates) {
      candidates = (responseData as any).data.candidates;
    }

    console.log('Recruitee API response (Candidates):', {
      totalCandidates: candidates.length,
      firstCandidate: candidates[0] ? {
        id: candidates[0].id,
        name: candidates[0].name,
        hired_at: candidates[0].hired_at,
        stage: candidates[0].stage,
        allKeys: Object.keys(candidates[0]),
        hasOfferId: !!(candidates[0] as any).offer_id,
        hasOffer: !!(candidates[0] as any).offer,
        hasOffers: !!(candidates[0] as any).offers,
        offerId: (candidates[0] as any).offer_id,
        offer: (candidates[0] as any).offer,
        offers: (candidates[0] as any).offers,
      } : null
    });

    return candidates;
  } catch (error) {
    console.error('Error fetching Recruitee candidates:', error);
    throw error;
  }
}

/**
 * Haalt candidates op voor een specifieke offer (vacature)
 */
export async function fetchCandidatesForOffer(offerId: number): Promise<RecruiteeCandidate[]> {
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    throw new Error('Recruitee API credentials not configured');
  }

  try {
    // Probeer candidates via offer endpoint
    const url = `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers/${offerId}/candidates`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Recruitee API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    let candidates: RecruiteeCandidate[] = [];
    
    if (Array.isArray(responseData)) {
      candidates = responseData;
    } else if (responseData.candidates) {
      candidates = responseData.candidates;
    } else if ((responseData as any).data?.candidates) {
      candidates = (responseData as any).data.candidates;
    }

    // Log voor debugging
    if (candidates.length > 0) {
      console.log(`Fetched ${candidates.length} candidates for offer ${offerId}`, {
        firstCandidateKeys: Object.keys(candidates[0]),
        hasOfferId: !!(candidates[0] as any).offer_id,
        hasOffer: !!(candidates[0] as any).offer,
        hasOffers: !!(candidates[0] as any).offers,
      });
    }

    return candidates;
  } catch (error) {
    console.error(`Error fetching candidates for offer ${offerId}:`, error);
    return [];
  }
}

/**
 * Haalt alle candidates/applications op voor alle offers
 * Inclusief solicitaties en hires
 */
export async function fetchAllCandidatesAndApplications(month?: number, year?: number): Promise<{
  applications: RecruiteeCandidate[];
  hires: RecruiteeCandidate[];
}> {
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    throw new Error('Recruitee API credentials not configured');
  }

  try {
    // Haal eerst alle offers op
    const offers = await fetchRecruiteeJobs({ status: 'published', perPage: 500 });
    
    // Haal voor elke offer de candidates op
    const allCandidates: RecruiteeCandidate[] = [];
    
    // Maak een lookup map voor offers op basis van ID
    const offerMap = new Map<number, RecruiteeJob>();
    offers.forEach(offer => {
      offerMap.set(offer.id, offer);
    });

    // Batch processing: verwerk offers in batches parallel voor betere performance
    const BATCH_SIZE = 10;
    const batches: RecruiteeJob[][] = [];
    for (let i = 0; i < offers.length; i += BATCH_SIZE) {
      batches.push(offers.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Processing ${offers.length} offers in ${batches.length} batches of ${BATCH_SIZE}`);
    
    // Verwerk batches parallel
    for (const batch of batches) {
      const batchPromises = batch.map(async (offer: RecruiteeJob) => {
        try {
          const candidates = await fetchCandidatesForOffer(offer.id);
          const companyName = offer.company?.name || 'Onbekend Bedrijf';
          
          return candidates.map(candidate => ({
            ...candidate,
            offer_id: offer.id,
            offer_title: offer.title || 'Vacature onbekend',
            offer_company: companyName,
          }));
        } catch (error) {
          console.warn(`Could not fetch candidates for offer ${offer.id} (${offer.title}):`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((enrichedCandidates: RecruiteeCandidate[]) => {
        allCandidates.push(...enrichedCandidates);
      });
    }
    
    console.log(`Total candidates fetched: ${allCandidates.length}`);

    // Gebruik een alternatieve aanpak: haal candidates op per offer via offer_id parameter
    // Dit zorgt ervoor dat we altijd de juiste offer informatie hebben
    // Alleen gebruiken als we nog weinig candidates hebben
    if (allCandidates.length < 50) {
      console.log(`Trying alternative approach: fetching candidates per offer using offer_id parameter`);
      
      // Batch processing voor betere performance
      const BATCH_SIZE = 10;
      const batches: RecruiteeJob[][] = [];
      for (let i = 0; i < offers.length; i += BATCH_SIZE) {
        batches.push(offers.slice(i, i + BATCH_SIZE));
      }
      
      // Verwerk batches parallel
      for (const batch of batches) {
        const batchPromises = batch.map(async (offer: RecruiteeJob) => {
          try {
            const candidatesByOfferId = await fetchRecruiteeCandidates({ 
              offerId: offer.id, 
              perPage: 500 
            });
            
            const existingIds = new Set(allCandidates.map(c => c.id));
            const companyName = offer.company?.name || 'Onbekend Bedrijf';
            
            return candidatesByOfferId
              .filter(candidate => !existingIds.has(candidate.id))
              .map(candidate => ({
                ...candidate,
                offer_id: offer.id,
                offer_title: offer.title || 'Vacature onbekend',
                offer_company: companyName,
              }));
          } catch (error) {
            return [];
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((enrichedCandidates: RecruiteeCandidate[]) => {
          allCandidates.push(...enrichedCandidates);
        });
      }
      
      console.log(`Total candidates after all methods: ${allCandidates.length}`);
    }

    // Filter op maand/jaar als opgegeven
    const filterByDate = (candidate: RecruiteeCandidate, dateField: string) => {
      const dateStr = (candidate as any)[dateField] || candidate.created_at || candidate.updated_at;
      if (!dateStr) return false;
      
      const date = new Date(dateStr);
      
      // Als jaar is opgegeven, filter altijd op jaar
      if (year !== undefined) {
        const yearMatches = date.getFullYear() === year;
        
        // Als ook maand is opgegeven, filter ook op maand
        if (month !== undefined) {
          return yearMatches && date.getMonth() === month;
        }
        
        // Alleen jaar filter
        return yearMatches;
      }
      
      // Als alleen maand is opgegeven (zonder jaar), filter op maand van huidige jaar
      if (month !== undefined) {
        return date.getMonth() === month;
      }
      
      // Geen filters, toon alles
      return true;
    };

    // Splits in applications (alle candidates) en hires (stage = hire of hired_at)
    const applications = allCandidates.filter(candidate => {
      // Filter altijd op jaar als opgegeven
      if (year !== undefined) {
        return filterByDate(candidate, 'created_at');
      }
      // Als alleen maand is opgegeven, filter op maand
      if (month !== undefined) {
        return filterByDate(candidate, 'created_at');
      }
      return true;
    });

    const hires = allCandidates.filter(candidate => {
      const isHire = candidate.hired_at || 
                     candidate.stage?.category === 'hire' ||
                     candidate.stage?.name?.toLowerCase().includes('hire') ||
                     candidate.stage?.name?.toLowerCase().includes('aangenomen');
      
      if (!isHire) return false;
      
      // Filter altijd op jaar als opgegeven
      if (year !== undefined) {
        // Voor hires, gebruik hired_at eerst, anders updated_at
        const hireDateStr = candidate.hired_at || candidate.updated_at;
        if (!hireDateStr) return false;
        const hireDate = new Date(hireDateStr);
        
        const yearMatches = hireDate.getFullYear() === year;
        
        if (month !== undefined) {
          return yearMatches && hireDate.getMonth() === month;
        }
        
        return yearMatches;
      }
      
      // Als alleen maand is opgegeven, filter op maand
      if (month !== undefined) {
        const hireDateStr = candidate.hired_at || candidate.updated_at;
        if (!hireDateStr) return false;
        const hireDate = new Date(hireDateStr);
        return hireDate.getMonth() === month;
      }
      
      return true;
    });

    return { applications, hires };
  } catch (error) {
    console.error('Error fetching candidates and applications:', error);
    throw error;
  }
}

/**
 * Haalt hires op (candidates met stage "hire" of hired_at datum)
 * Gefilterd op maand
 */
export async function fetchRecruiteeHires(month?: number, year?: number): Promise<RecruiteeCandidate[]> {
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    throw new Error('Recruitee API credentials not configured');
  }

  try {
    const { hires } = await fetchAllCandidatesAndApplications(month, year);
    return hires;
  } catch (error) {
    console.error('Error fetching Recruitee hires:', error);
    throw error;
  }
}

