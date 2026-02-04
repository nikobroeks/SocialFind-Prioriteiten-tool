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


    return candidates;
  } catch (error) {
    console.error('Error fetching Recruitee candidates:', error);
    throw error;
  }
}

/**
 * Haalt placements op voor een specifieke offer (vacature)
 * Placements bevatten stage informatie per candidate
 */
export async function fetchPlacementsForOffer(offerId: number): Promise<any[]> {
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    throw new Error('Recruitee API credentials not configured');
  }

  try {
    // Probeer placements endpoint
    const url = `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers/${offerId}/placements`;
    
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
      console.warn(`[OFFER ${offerId}] Placements endpoint error: ${response.status}`);
      return [];
    }

    const responseData = await response.json();
    let placements: any[] = [];
    
    if (Array.isArray(responseData)) {
      placements = responseData;
    } else if (responseData.placements) {
      placements = responseData.placements;
    } else if ((responseData as any).data?.placements) {
      placements = (responseData as any).data.placements;
    }


    return placements;
  } catch (error) {
    console.warn(`[OFFER ${offerId}] Error fetching placements:`, error);
    return [];
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
    
    // Log API response structuur
    console.log(`[OFFER ${offerId}] API Response type:`, Array.isArray(responseData) ? 'array' : typeof responseData);
    console.log(`[OFFER ${offerId}] Response keys:`, Object.keys(responseData).slice(0, 10));
    
    // Recruitee API kan verschillende formats hebben:
    // 1. Direct array van candidates
    // 2. { candidate: {...}, references: [...] } - zoals in de network tab (individuele candidate)
    // 3. { candidates: [...] }
    // 4. { data: { candidates: [...] } }
    
    let candidates: RecruiteeCandidate[] = [];
    let references: any[] = [];
    
    if (Array.isArray(responseData)) {
      candidates = responseData;
      console.log(`[OFFER ${offerId}] Got ${candidates.length} candidates (array format)`);
    } else if (responseData.candidate) {
      // Enkele candidate met references (zoals in network tab)
      candidates = [responseData.candidate];
      references = responseData.references || [];
      console.log(`[OFFER ${offerId}] Got 1 candidate with ${references.length} references`);
    } else if (responseData.candidates) {
      candidates = responseData.candidates;
      references = responseData.references || [];
      console.log(`[OFFER ${offerId}] Got ${candidates.length} candidates with ${references.length} references`);
    } else if ((responseData as any).data?.candidates) {
      candidates = (responseData as any).data.candidates;
      references = (responseData as any).data.references || (responseData as any).references || [];
      console.log(`[OFFER ${offerId}] Got ${candidates.length} candidates from data.candidates`);
    } else if ((responseData as any).data?.candidate) {
      candidates = [(responseData as any).data.candidate];
      references = (responseData as any).data.references || (responseData as any).references || [];
      console.log(`[OFFER ${offerId}] Got 1 candidate from data.candidate`);
    }
    
    // ALTIJD per candidate de volledige data ophalen (met placements en references)
    // Het /offers/{offerId}/candidates endpoint geeft alleen basisdata zonder placements/references
    if (candidates.length > 0) {
      // Als we al references hebben, gebruik die
      if (references.length === 0) {
        console.log(`[OFFER ${offerId}] ⚠️ No references in response! Fetching full data for ${candidates.length} candidates...`);
      } else {
        console.log(`[OFFER ${offerId}] References found, but fetching full data anyway to ensure placements are included...`);
      }
      
      // Batch processing om niet te veel requests tegelijk te doen
      const BATCH_SIZE = 5;
      const allEnrichedCandidates: Array<{candidate: any, references: any[]}> = [];
      
      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i/BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(candidates.length/BATCH_SIZE);
        console.log(`[OFFER ${offerId}] Processing batch ${batchNum}/${totalBatches} (${batch.length} candidates)...`);
        
        const batchResults = await Promise.all(
          batch.map(async (candidate: any, batchIdx: number) => {
            const globalIdx = i + batchIdx;
            if (globalIdx < 3) {
              console.log(`[OFFER ${offerId}] Fetching candidate ${globalIdx + 1}/${candidates.length}: ${candidate.name} (ID: ${candidate.id})`);
            }
            try {
              // Haal individuele candidate op met volledige data (zoals in network tab)
              const candidateUrl = `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/candidates/${candidate.id}`;
              const candidateResponse = await fetch(candidateUrl, {
                headers: {
                  'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (candidateResponse.ok) {
                const candidateData = await candidateResponse.json();
                if (candidateData.candidate) {
                  const c = candidateData.candidate;
                  if (globalIdx < 3) {
                    console.log(`[OFFER ${offerId}] ✓ Got full data for ${c.name}:`, {
                      is_hired: c.is_hired,
                      hired_at: c.hired_at,
                      placement_hired_at: c.placements?.[0]?.hired_at,
                      placement_stage_id: c.placements?.[0]?.stage_id,
                      placement_hired_in_this_placement: c.placements?.[0]?.hired_in_this_placement,
                      references_count: candidateData.references?.length || 0,
                    });
                  }
                  return {
                    candidate: candidateData.candidate,
                    references: candidateData.references || [],
                  };
                }
              } else {
                console.warn(`[OFFER ${offerId}] Failed to fetch candidate ${candidate.id}: ${candidateResponse.status}`);
              }
            } catch (error) {
              console.warn(`[OFFER ${offerId}] Error fetching full data for candidate ${candidate.id}:`, error);
            }
            return { candidate, references: [] };
          })
        );
        
        allEnrichedCandidates.push(...batchResults);
      }
      
      // Combineer alle references
      const allReferences: any[] = [];
      allEnrichedCandidates.forEach(({ references: refs }) => {
        if (refs && Array.isArray(refs)) {
          refs.forEach((ref: any) => {
            if (!allReferences.find(r => r.id === ref.id && r.type === ref.type)) {
              allReferences.push(ref);
            }
          });
        }
      });
      
      references = allReferences;
      candidates = allEnrichedCandidates.map(({ candidate }) => candidate);
      
      console.log(`[OFFER ${offerId}] ✓ Combined ${references.length} unique references from ${allEnrichedCandidates.length} candidates`);
    }
    
    // Maak een map van stage ID -> stage details uit references
    const stageMap = new Map<number, any>();
    if (references && Array.isArray(references)) {
      references.forEach((ref: any) => {
        if (ref.type === 'Stage' && ref.id) {
          stageMap.set(ref.id, {
            id: ref.id,
            name: ref.name,
            category: ref.category,
            group: ref.group,
          });
        }
      });
      console.log(`[OFFER ${offerId}] Created stage map with ${stageMap.size} stages`);
    }
    
    // Enrich candidates met stage informatie uit placements en references
    return candidates.map(candidate => {
      const candidateAny = candidate as any;
      const placements = candidateAny.placements || [];
      
      // Log sample candidate data - ALTIJD voor eerste 3
      const candidateIndex = candidates.indexOf(candidate);
      if (candidateIndex < 3) {
        console.log(`[OFFER ${offerId}] Sample candidate ${candidateIndex + 1}: ${candidate.name} (ID: ${candidate.id}):`, {
          is_hired: candidateAny.is_hired,
          hired_at: candidate.hired_at,
          placements_count: placements.length,
          placement_stage_id: placements[0]?.stage_id,
          placement_hired_at: placements[0]?.hired_at,
          placement_hired_in_this_placement: placements[0]?.hired_in_this_placement,
          has_references: !!candidateAny._references,
          references_count: candidateAny._references?.length || 0,
        });
      }
      
      // Zoek de stage ID uit placements - API gebruikt snake_case!
      let stageId: number | null = null;
      if (placements.length > 0) {
        // Gebruik de eerste placement (of zoek de juiste voor deze offer)
        stageId = placements[0].stage_id || placements[0].stageId || null;
      }
      
      // Haal stage details op uit de stage map
      let stageInfo = candidate.stage;
      if (stageId && stageMap.has(stageId)) {
        const stageDetails = stageMap.get(stageId);
        stageInfo = {
          id: stageDetails.id,
          name: stageDetails.name,
          category: stageDetails.category,
        };
      }
      
      // Zoek de placement die bij deze offer hoort
      let placementForOffer = placements[0];
      if (placements.length > 1) {
        const matchingPlacement = placements.find((p: any) => p.offerId === offerId);
        if (matchingPlacement) {
          placementForOffer = matchingPlacement;
        }
      }
      
      return {
        ...candidate,
        offer_id: offerId,
        stage: stageInfo,
        // Behoud placements en references voor latere checks
        placements: placements,
        _references: references, // Tijdelijk voor debugging
        // Voeg ook de placement voor deze offer toe voor snelle access
        _placementForOffer: placementForOffer,
      };
    });
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
  stats?: {
    totalCandidates: number;
    hiresFound: number;
    notFound: number;
    byHiredAt: number;
    byStageId: number;
    byPlacementStageId: number;
    byCurrentPlacementStageId: number;
    byStageCategory: number;
    byPlacementCategory: number;
    byStageName: number;
    byPlacementStageName: number;
    noMatchSample: Array<{id: number, name: string, reason: string, data: any}>;
  };
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
    
    
    // Verwerk batches parallel
    for (const batch of batches) {
      const batchPromises = batch.map(async (offer: RecruiteeJob) => {
        try {
          // Haal zowel candidates als placements op
          const [candidates, placements] = await Promise.all([
            fetchCandidatesForOffer(offer.id),
            fetchPlacementsForOffer(offer.id),
          ]);
          
          // Maak een map van candidate_id -> placement voor snelle lookup
          const placementMap = new Map<number, any>();
          placements.forEach((placement: any) => {
            const candidateId = placement.candidate_id || placement.candidate?.id;
            if (candidateId) {
              placementMap.set(candidateId, placement);
            }
          });
          
          const companyName = offer.company?.name || 'Onbekend Bedrijf';
          
          return candidates.map(candidate => {
            const candidateAny = candidate as any;
            
            // EERST: Check placements die we apart hebben opgehaald via placements endpoint
            const placementFromMap = placementMap.get(candidate.id);
            let stageInfo = candidate.stage;
            
            if (placementFromMap?.stage) {
              stageInfo = {
                id: placementFromMap.stage.id || 0,
                name: placementFromMap.stage.name || '',
                category: placementFromMap.stage.category,
              };
            }
            // TWEEDE: Check placements array in candidate object zelf
            else if (candidateAny.placements && Array.isArray(candidateAny.placements)) {
              // Zoek placement die bij deze offer hoort
              const placementForOffer = candidateAny.placements.find(
                (p: any) => (p.offer_id === offer.id) || (p.offer?.id === offer.id)
              );
              
              if (placementForOffer?.stage) {
                stageInfo = {
                  id: placementForOffer.stage.id || 0,
                  name: placementForOffer.stage.name || '',
                  category: placementForOffer.stage.category,
                };
              }
              // Als er geen specifieke placement is, gebruik de eerste placement
              else if (candidateAny.placements[0]?.stage) {
                stageInfo = {
                  id: candidateAny.placements[0].stage.id || 0,
                  name: candidateAny.placements[0].stage.name || '',
                  category: candidateAny.placements[0].stage.category,
                };
              }
            }
            
            // Fallback: check current_placement
            if (!stageInfo && candidateAny.current_placement?.stage) {
              stageInfo = {
                id: candidateAny.current_placement.stage.id || 0,
                name: candidateAny.current_placement.stage.name || '',
                category: candidateAny.current_placement.stage.category,
              };
            }
            
            // Fallback: check current_stage
            if (!stageInfo && candidateAny.current_stage) {
              stageInfo = {
                id: candidateAny.current_stage.id || 0,
                name: candidateAny.current_stage.name || '',
                category: candidateAny.current_stage.category,
              };
            }
            
            // Fallback: check stage_name en stage_id
            if (!stageInfo && (candidateAny.stage_name || candidateAny.stage_id)) {
              stageInfo = {
                id: candidateAny.stage_id || 0,
                name: candidateAny.stage_name || '',
                category: candidateAny.stage_category,
              };
            }
            
            // Voeg placement uit map toe aan candidate object voor latere checks
            const allPlacements = candidateAny.placements || [];
            if (placementFromMap && !allPlacements.find((p: any) => p.id === placementFromMap.id)) {
              allPlacements.push(placementFromMap);
            }
            
            const enrichedCandidate: RecruiteeCandidate = {
              ...candidate,
              offer_id: offer.id,
              offer_title: offer.title || 'Vacature onbekend',
              offer_company: companyName,
              stage: stageInfo,
              // Behoud alle placements voor latere checks
              placements: allPlacements,
              current_placement: candidateAny.current_placement || placementFromMap,
            };
            
            return enrichedCandidate;
          });
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
    

    // Gebruik een alternatieve aanpak: haal candidates op per offer via offer_id parameter
    // Dit zorgt ervoor dat we altijd de juiste offer informatie hebben
    // Alleen gebruiken als we nog weinig candidates hebben
    if (allCandidates.length < 50) {
      
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


    // Statistieken voor debugging
    const hireStats = {
      totalCandidates: allCandidates.length,
      byHiredAt: 0,
      byStageId: 0,
      byPlacementStageId: 0,
      byCurrentPlacementStageId: 0,
      byStageCategory: 0,
      byPlacementCategory: 0,
      byStageName: 0,
      byPlacementStageName: 0,
      noMatch: [] as Array<{id: number, name: string, reason: string, data: any}>,
    };

    console.log(`\n=== HIRE DETECTION START ===`);
    console.log(`Total candidates to check: ${allCandidates.length}`);
    
    // Log sample van eerste paar candidates
    if (allCandidates.length > 0) {
      console.log(`\nSample candidates (first 3):`);
      allCandidates.slice(0, 3).forEach((c, idx) => {
        const cAny = c as any;
        console.log(`  ${idx + 1}. ${c.name} (ID: ${c.id}):`, {
          is_hired: cAny.is_hired,
          hired_at: c.hired_at,
          placement_hired_at: cAny.placements?.[0]?.hired_at,
          placement_stage_id: cAny.placements?.[0]?.stage_id,
          placement_hired_in_this_placement: cAny.placements?.[0]?.hired_in_this_placement,
          has_references: !!cAny._references,
          references_count: cAny._references?.length || 0,
        });
      });
    }
    
    const hires = allCandidates.filter(candidate => {
      const candidateAny = candidate as any;
      
      // Check stage informatie uit verschillende bronnen
      const stageName = candidate.stage?.name?.toLowerCase() || '';
      const stageCategory = candidate.stage?.category?.toLowerCase() || '';
      
      // Check placements array - Recruitee gebruikt placements[].stageId
      const placements = candidate.placements || candidateAny.placements;
      let placementStageId: number | undefined;
      let placementStageName = '';
      let placementCategory = '';
      
      if (placements && Array.isArray(placements) && placements.length > 0) {
        // Gebruik de eerste placement (of zoek de juiste voor deze offer)
        const placement = placements[0];
        
        // Recruitee gebruikt stage_id (snake_case) direct in placement object
        placementStageId = placement.stage_id || placement.stageId || placement.stage?.id;
        
        // Als we stage details hebben uit references, gebruik die
        if (placementStageId && candidateAny._references) {
          const stageRef = candidateAny._references.find((ref: any) => 
            ref.type === 'Stage' && ref.id === placementStageId
          );
          if (stageRef) {
            placementStageName = stageRef.name?.toLowerCase() || '';
            placementCategory = stageRef.category?.toLowerCase() || '';
          }
        }
        
        // Fallback: gebruik stage object uit placement als die er is
        if (!placementCategory && placement.stage) {
          placementStageName = placement.stage.name?.toLowerCase() || '';
          placementCategory = placement.stage.category?.toLowerCase() || '';
        }
      }
      
      // Check current_placement
      const currentPlacement = candidate.current_placement || candidateAny.current_placement;
      const currentPlacementStage = currentPlacement?.stage?.name?.toLowerCase() || '';
      const currentPlacementCategory = currentPlacement?.stage?.category?.toLowerCase() || '';
      const currentPlacementStageId = currentPlacement?.stage?.id;
      
      // Check andere mogelijke velden
      const currentStage = candidateAny.current_stage?.name?.toLowerCase() || '';
      const stageNameField = candidateAny.stage_name?.toLowerCase() || '';
      const status = candidateAny.status?.toLowerCase() || '';
      const state = candidateAny.state?.toLowerCase() || '';
      
      // Haal stage ID op uit verschillende bronnen
      const stageId = candidate.stage?.id || candidateAny.stage_id || candidateAny.current_stage_id;
      
      // Check alle mogelijke manieren om een hire te detecteren
      let isHire = false;
      let reason = '';
      
      // Check op hire - gebruik ALLE beschikbare indicatoren
      // 1. Check candidate.is_hired (directe indicator) - API gebruikt snake_case!
      if (candidateAny.is_hired === true) {
        isHire = true;
        reason = 'candidate.is_hired === true';
        hireStats.byHiredAt++;
      }
      // 2. Check placement.hired_at (in placement object) - API gebruikt snake_case!
      else if (placements && placements.length > 0 && placements[0].hired_at) {
        isHire = true;
        reason = `placement.hired_at: ${placements[0].hired_at}`;
        hireStats.byHiredAt++;
      }
      // 3. Check placement.hired_in_this_placement - API gebruikt snake_case!
      else if (placements && placements.length > 0 && placements[0].hired_in_this_placement === true) {
        isHire = true;
        reason = 'placement.hired_in_this_placement === true';
        hireStats.byHiredAt++;
      }
      // 4. Check candidate.hired_at (oude veld)
      else if (candidate.hired_at) {
        isHire = true;
        reason = 'candidate.hired_at datum';
        hireStats.byHiredAt++;
      }
      // 5. Check placement category uit references
      else if (placementCategory === 'hire') {
        // BELANGRIJK: Check placement category uit references
        isHire = true;
        reason = `placement category "hire" (stageId: ${placementStageId})`;
        hireStats.byPlacementCategory++;
      } else if (stageCategory === 'hire') {
        isHire = true;
        reason = 'stage category "hire"';
        hireStats.byStageCategory++;
      } else if (currentPlacementCategory === 'hire') {
        isHire = true;
        reason = 'current_placement category "hire"';
        hireStats.byCurrentPlacementStageId++;
      } else if (placementStageName === 'aangenomen' || placementStageName.includes('aangenomen') || placementStageName.includes('hire')) {
        isHire = true;
        reason = `placement stage name "${placementStageName}"`;
        hireStats.byPlacementStageName++;
      } else if (stageName === 'aangenomen' || stageName.includes('aangenomen') || stageName.includes('hire')) {
        isHire = true;
        reason = `stage name "${stageName}"`;
        hireStats.byStageName++;
      }
      
      // Als geen match, log waarom niet - gebruik ALLE beschikbare stage informatie
      if (!isHire) {
        // Haal de daadwerkelijke stage naam op (niet lowercase voor display)
        const actualStageName = candidate.stage?.name || 
                                (placements && placements.length > 0 ? placements[0]?.stage?.name : null) ||
                                currentPlacement?.stage?.name ||
                                candidateAny.stage_name ||
                                candidateAny.current_stage?.name ||
                                '';
        
        // Haal de daadwerkelijke stage ID op
        const actualStageId = candidate.stage?.id ||
                             stageId ||
                             (placements && placements.length > 0 ? placements[0]?.stage?.id : null) ||
                             currentPlacement?.stage?.id ||
                             candidateAny.stage_id ||
                             candidateAny.current_stage_id ||
                             null;
        
        // Haal de daadwerkelijke stage category op
        const actualStageCategory = candidate.stage?.category ||
                                   stageCategory ||
                                   (placements && placements.length > 0 ? placements[0]?.stage?.category : null) ||
                                   currentPlacement?.stage?.category ||
                                   '';
        
        hireStats.noMatch.push({
          id: candidate.id,
          name: candidate.name,
          reason: actualStageName ? `Stage: "${actualStageName}" (geen hire)` : 'Geen stage informatie gevonden',
          data: {
            // Direct stage object (gebruik de daadwerkelijke waarden)
            stage: candidate.stage ? {
              id: candidate.stage.id,
              name: candidate.stage.name,
              category: candidate.stage.category,
            } : null,
            // Daadwerkelijke stage informatie (voor display)
            actual_stage_id: actualStageId,
            actual_stage_name: actualStageName,
            actual_stage_category: actualStageCategory,
            // Oude velden (voor backwards compatibility)
            stage_id: stageId,
            stage_name: candidate.stage?.name || stageName || candidateAny.stage_name || '',
            stage_category: candidate.stage?.category || stageCategory || '',
            // Placements informatie
            placements_count: placements?.length || 0,
            placements: placements?.map((p: any) => ({
              id: p.id,
              stage_id: p.stage?.id,
              stage_name: p.stage?.name,
              stage_category: p.stage?.category,
              offer_id: p.offer_id || p.offer?.id,
            })) || [],
            placement_stage_id: placementStageId,
            placement_stage_name: placementStageName ? (placements?.find((p: any) => p.stage_id === placementStageId || p.stageId === placementStageId || p.stage?.id === placementStageId)?.stage?.name || placementStageName) : null,
            placement_category: placementCategory,
            // Current placement
            current_placement: currentPlacement ? {
              id: currentPlacement.id,
              stage_id: currentPlacement.stage?.id,
              stage_name: currentPlacement.stage?.name,
              stage_category: currentPlacement.stage?.category,
            } : null,
            // Andere velden
            current_stage: candidateAny.current_stage,
            current_stage_id: candidateAny.current_stage_id,
            stage_name_field: candidateAny.stage_name,
            status: candidateAny.status,
            state: candidateAny.state,
            hired_at: candidate.hired_at,
            is_hired: candidateAny.is_hired,
            placement_hired_at: placements && placements.length > 0 ? placements[0].hired_at : null,
            placement_hired_in_this_placement: placements && placements.length > 0 ? placements[0].hired_in_this_placement : null,
            offer_id: candidate.offer_id,
            offer_title: candidate.offer_title,
            offer_company: candidate.offer_company,
            // Alle beschikbare keys voor debugging
            allKeys: Object.keys(candidate),
          }
        });
      }
      
      // Return true als het een hire is (zonder filtering op maand/jaar hier!)
      return isHire;
    });
    
    // Filter hires op maand/jaar NA de hire detection - gebruik placement.hired_at eerst!
    const filteredHires = hires.filter(hire => {
      // Als er geen filter is, toon alles
      if (year === undefined && month === undefined) {
        return true;
      }
      
      const hireAny = hire as any;
      const placements = hireAny.placements || [];
      
      // Voor hires, gebruik placement.hired_at eerst, dan candidate.hired_at, dan updated_at
      const hireDateStr = (placements.length > 0 && placements[0].hired_at) 
                        || hire.hired_at 
                        || hire.updated_at;
      
      if (!hireDateStr) {
        // Geen datum beschikbaar, skip deze hire als we filteren
        console.log(`[FILTER] Skipping hire ${hire.name} (${hire.id}): no date available`);
        return false;
      }
      
      const hireDate = new Date(hireDateStr);
      const hireYear = hireDate.getFullYear();
      const hireMonth = hireDate.getMonth();
      
      // Filter op jaar als opgegeven
      if (year !== undefined) {
        const yearMatches = hireYear === year;
        
        // Als ook maand is opgegeven, filter ook op maand
        if (month !== undefined) {
          const monthMatches = hireMonth === month;
          const result = yearMatches && monthMatches;
          if (!result) {
            console.log(`[FILTER] Skipping hire ${hire.name}: year=${hireYear} (expected ${year}), month=${hireMonth} (expected ${month})`);
          }
          return result;
        }
        
        // Alleen jaar filter
        return yearMatches;
      }
      
      // Als alleen maand is opgegeven, filter op maand van huidige jaar
      if (month !== undefined) {
        // Check ook het jaar - gebruik huidige jaar als default
        const currentYear = new Date().getFullYear();
        const result = hireYear === currentYear && hireMonth === month;
        if (!result) {
          console.log(`[FILTER] Skipping hire ${hire.name}: year=${hireYear} (expected ${currentYear}), month=${hireMonth} (expected ${month})`);
        }
        return result;
      }
      
      return true;
    });
    
    const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total applications: ${applications.length}`);
    console.log(`Total hires (before date filter): ${hires.length}`);
    console.log(`Total hires (after date filter): ${filteredHires.length}`);
    console.log(`Filter: month=${month} (${month !== undefined ? monthNames[month] : 'none'}), year=${year}`);
    
    // Debug: toon ALLE hires met hun datums voor februari
    if (hires.length > 0 && month === 1) {
      console.log(`\n=== DEBUG: ALL hires with dates (looking for month 1 = Februari, year ${year}) ===`);
      const februaryHires: any[] = [];
      const nonFebruaryHires: any[] = [];
      
      hires.forEach((hire, idx) => {
        const hireAny = hire as any;
        const placements = hireAny.placements || [];
        const hireDateStr = (placements.length > 0 && placements[0].hired_at) || hire.hired_at || hire.updated_at;
        if (hireDateStr) {
          const hireDate = new Date(hireDateStr);
          const matches = hireDate.getMonth() === 1 && hireDate.getFullYear() === year;
          if (matches) {
            februaryHires.push({ hire, dateStr: hireDateStr, date: hireDate });
          } else {
            nonFebruaryHires.push({ hire, dateStr: hireDateStr, date: hireDate, month: hireDate.getMonth(), year: hireDate.getFullYear() });
          }
        } else {
          nonFebruaryHires.push({ hire, dateStr: null, date: null });
        }
      });
      
      console.log(`\n✓ February hires found: ${februaryHires.length}`);
      februaryHires.slice(0, 10).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.hire.name}: ${item.dateStr} -> ${item.date.getFullYear()}-${item.date.getMonth() + 1}`);
      });
      
      console.log(`\n✗ Non-February hires: ${nonFebruaryHires.length}`);
      // Groepeer per maand
      const byMonth = new Map<number, any[]>();
      nonFebruaryHires.forEach(item => {
        if (item.date) {
          const m = item.date.getMonth();
          if (!byMonth.has(m)) {
            byMonth.set(m, []);
          }
          byMonth.get(m)!.push(item);
        }
      });
      byMonth.forEach((items, m) => {
        console.log(`  ${monthNames[m]}: ${items.length} hires`);
      });
    }
    console.log(`Hires found by method:`);
    console.log(`  - byHiredAt: ${hireStats.byHiredAt}`);
    console.log(`  - byPlacementCategory: ${hireStats.byPlacementCategory}`);
    console.log(`  - byStageCategory: ${hireStats.byStageCategory}`);
    console.log(`  - byPlacementStageName: ${hireStats.byPlacementStageName}`);
    console.log(`  - byStageName: ${hireStats.byStageName}`);
    
    if (filteredHires.length > 0) {
      console.log(`\nFirst 5 filtered hires:`);
      filteredHires.slice(0, 5).forEach((hire, idx) => {
        const hAny = hire as any;
        const placements = hAny.placements || [];
        const hireDateStr = (placements.length > 0 && placements[0].hired_at) || hire.hired_at || hire.updated_at;
        const hireDate = hireDateStr ? new Date(hireDateStr) : null;
        console.log(`  ${idx + 1}. ${hire.name} (ID: ${hire.id})`);
        console.log(`     - is_hired: ${hAny.is_hired}`);
        console.log(`     - hired_at: ${hire.hired_at}`);
        console.log(`     - placement.hired_at: ${placements[0]?.hired_at || 'GEEN'}`);
        console.log(`     - date used: ${hireDateStr} (${hireDate ? `${hireDate.getFullYear()}-${hireDate.getMonth()}` : 'N/A'})`);
        console.log(`     - placement.stage_id: ${placements[0]?.stage_id || 'GEEN'}`);
        console.log(`     - stage.category: ${hire.stage?.category || 'GEEN'}`);
      });
    }
    
    return { 
      applications, 
      hires: filteredHires,
      stats: {
        totalCandidates: hireStats.totalCandidates,
        hiresFound: filteredHires.length,
        notFound: hireStats.noMatch.length,
        byHiredAt: hireStats.byHiredAt,
        byStageId: hireStats.byStageId,
        byPlacementStageId: hireStats.byPlacementStageId,
        byCurrentPlacementStageId: hireStats.byCurrentPlacementStageId,
        byStageCategory: hireStats.byStageCategory,
        byPlacementCategory: hireStats.byPlacementCategory,
        byStageName: hireStats.byStageName,
        byPlacementStageName: hireStats.byPlacementStageName,
        noMatchSample: hireStats.noMatch.slice(0, 5), // Eerste 5 voor UI
      }
    };
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

/**
 * Silver Medalist: Candidate who reached late stages but was not hired
 * Late stages include: Hiring Manager Interview, Offer, Final Interview, etc.
 */
export interface SilverMedalistCandidate extends RecruiteeCandidate {
  furthest_stage?: {
    id: number;
    name: string;
    category?: string;
  };
  furthest_stage_date?: string;
  previous_offer_id?: number;
  previous_offer_title?: string;
  previous_offer_company?: string;
}

/**
 * Late stage names that indicate a candidate was close to being hired
 */
const LATE_STAGE_KEYWORDS = [
  'hiring manager',
  'hiring manager interview',
  'final interview',
  'final round',
  'offer',
  'aanbod',
  'eindgesprek',
  'laatste ronde',
  'beslissing',
  'decision',
];

/**
 * Checks if a stage name indicates a late-stage interview
 */
function isLateStage(stageName: string | undefined): boolean {
  if (!stageName) return false;
  const normalized = stageName.toLowerCase().trim();
  return LATE_STAGE_KEYWORDS.some(keyword => normalized.includes(keyword));
}

/**
 * Fetches stages from Recruitee API
 * Tries multiple endpoints to get stage information
 */
async function fetchStagesMap(): Promise<Map<number, { id: number; name: string; category?: string }>> {
  const stageMap = new Map<number, { id: number; name: string; category?: string }>();
  
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    return stageMap;
  }

  try {
    // Method 1: Try direct stages endpoint
    try {
      const stagesUrl = `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/stages`;
      const stagesResponse = await fetch(stagesUrl, {
        headers: {
          'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (stagesResponse.ok) {
        const stagesData = await stagesResponse.json();
        const stages = Array.isArray(stagesData) ? stagesData : (stagesData.stages || stagesData.data || []);
        stages.forEach((stage: any) => {
          if (stage.id && stage.name) {
            stageMap.set(stage.id, {
              id: stage.id,
              name: stage.name,
              category: stage.category,
            });
          }
        });
        console.log(`[SILVER-MEDALISTS] Found ${stageMap.size} stages via stages endpoint`);
      }
    } catch (error) {
      console.warn('[SILVER-MEDALISTS] Stages endpoint not available, trying alternatives...');
    }
    
    // Method 2: Try to fetch stages from sample candidates (they have references)
    if (stageMap.size === 0) {
      try {
        const sampleCandidates = await fetchRecruiteeCandidates({ perPage: 20 });
        for (const candidate of sampleCandidates.slice(0, 5)) {
          try {
            // Fetch full candidate data with references
            const candidateUrl = `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/candidates/${candidate.id}`;
            const candidateResponse = await fetch(candidateUrl, {
              headers: {
                'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (candidateResponse.ok) {
              const candidateData = await candidateResponse.json();
              const references = candidateData.references || candidateData._references || [];
              
              references.forEach((ref: any) => {
                if (ref.type === 'Stage' && ref.id && ref.name) {
                  stageMap.set(ref.id, {
                    id: ref.id,
                    name: ref.name,
                    category: ref.category,
                  });
                }
              });
            }
          } catch (error) {
            // Continue with next candidate
          }
        }
        console.log(`[SILVER-MEDALISTS] Found ${stageMap.size} stages via candidate references`);
      } catch (error) {
        console.warn('[SILVER-MEDALISTS] Could not fetch stages from candidates:', error);
      }
    }
    
    // Method 3: Try to fetch stages from offers (offers may contain stages)
    if (stageMap.size === 0) {
      try {
        const offers = await fetchRecruiteeJobs({ status: 'published', perPage: 10 });
        
        for (const offer of offers.slice(0, 5)) {
          try {
            const offerDetails = await fetchRecruiteeJob(offer.id);
            if (offerDetails) {
              const offerAny = offerDetails as any;
              // Check for stages in offer
              if (offerAny.stages && Array.isArray(offerAny.stages)) {
                offerAny.stages.forEach((stage: any) => {
                  if (stage.id && stage.name) {
                    stageMap.set(stage.id, {
                      id: stage.id,
                      name: stage.name,
                      category: stage.category,
                    });
                  }
                });
              }
              // Check for pipeline stages
              if (offerAny.pipeline && offerAny.pipeline.stages) {
                offerAny.pipeline.stages.forEach((stage: any) => {
                  if (stage.id && stage.name) {
                    stageMap.set(stage.id, {
                      id: stage.id,
                      name: stage.name,
                      category: stage.category,
                    });
                  }
                });
              }
            }
          } catch (error) {
            // Continue with next offer
          }
        }
        console.log(`[SILVER-MEDALISTS] Found ${stageMap.size} stages via offers`);
      } catch (error) {
        console.warn('[SILVER-MEDALISTS] Could not fetch stages from offers:', error);
      }
    }
    
    console.log(`[SILVER-MEDALISTS] Built stage map with ${stageMap.size} stages`);
  } catch (error) {
    console.warn('[SILVER-MEDALISTS] Error building stage map:', error);
  }
  
  return stageMap;
}

/**
 * Fetches Silver Medalist candidates: disqualified candidates who reached late stages
 * These are candidates who were close to being hired but didn't make it
 */
export async function fetchSilverMedalistCandidates(): Promise<SilverMedalistCandidate[]> {
  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    throw new Error('Recruitee API credentials not configured');
  }

  try {
    console.log('[SILVER-MEDALISTS] Starting to fetch candidates...');
    
    // First, build a map of stage_id -> stage name
    const stageMap = await fetchStagesMap();
    
    // OPTIMIZATION: Use fetchRecruiteeCandidates to get all candidates at once
    // This is much faster than fetching per offer
    console.log('[SILVER-MEDALISTS] Fetching all candidates via candidates endpoint...');
    let allCandidates: RecruiteeCandidate[] = [];
    
    try {
      // Fetch ALL candidates by paginating through all pages
      console.log('[SILVER-MEDALISTS] Fetching all candidates with pagination...');
      allCandidates = [];
      let page = 1;
      let hasMore = true;
      const perPage = 100; // Smaller page size for reliability
      
      while (hasMore) {
        const pageCandidates = await fetchRecruiteeCandidates({ perPage, page });
        console.log(`[SILVER-MEDALISTS] Page ${page}: fetched ${pageCandidates.length} candidates`);
        
        if (pageCandidates.length === 0) {
          hasMore = false;
        } else {
          allCandidates.push(...pageCandidates);
          // If we got fewer than perPage, we're done
          if (pageCandidates.length < perPage) {
            hasMore = false;
          } else {
            page++;
          }
        }
        
        // Safety limit: don't fetch more than 50 pages (5000 candidates)
        if (page > 50) {
          console.warn(`[SILVER-MEDALISTS] Reached page limit (50 pages), stopping pagination`);
          hasMore = false;
        }
      }
      
      console.log(`[SILVER-MEDALISTS] Total fetched: ${allCandidates.length} candidates across ${page} pages`);
      
      // If we got candidates, we need to enrich them with offer info and stage names
      if (allCandidates.length > 0) {
        const offers = await fetchRecruiteeJobs({ status: 'published', perPage: 500 });
        const offerMap = new Map<number, RecruiteeJob>();
        offers.forEach(offer => offerMap.set(offer.id, offer));
        
        // Enrich candidates with offer info and stage names
        allCandidates = allCandidates.map(candidate => {
          const candidateAny = candidate as any;
          
          // Try to find offer_id from multiple sources
          let offerId = candidate.offer_id || candidateAny.offerId || candidateAny.current_offer_id;
          const placements = candidateAny.placements || [];
          
          // If no offer_id, try to get it from placements (check all placements, not just first)
          if (!offerId && placements.length > 0) {
            for (const placement of placements) {
              offerId = placement.offer_id || placement.offerId || placement.offer?.id || null;
              if (offerId) break; // Found one, stop searching
            }
          }
          
          // Also check current_placement
          if (!offerId && candidateAny.current_placement) {
            offerId = candidateAny.current_placement.offer_id || 
                     candidateAny.current_placement.offerId || 
                     candidateAny.current_placement.offer?.id || null;
          }
          
          const offer = offerId ? offerMap.get(offerId) : null;
          
          // Log if we couldn't find offer info
          if (!offer && allCandidates.indexOf(candidate) < 5) {
            console.log(`[SILVER-MEDALISTS] Candidate ${candidate.name} (ID: ${candidate.id}) - No offer found. offer_id: ${offerId}, placements: ${placements.length}`);
          }
          
          // Enrich placements with stage names
          const enrichedPlacements = placements.map((placement: any) => {
            const stageId = placement.stage_id || placement.stageId || placement.stage?.id;
            if (stageId && stageMap.has(stageId)) {
              const stageInfo = stageMap.get(stageId)!;
              return {
                ...placement,
                stage: {
                  id: stageInfo.id,
                  name: stageInfo.name,
                  category: stageInfo.category,
                },
              };
            }
            return placement;
          });
          
          // Enrich candidate.stage if we have stage_id
          let enrichedStage = candidate.stage;
          if (!enrichedStage) {
            const stageId = candidateAny.stage_id || candidateAny.current_stage_id;
            if (stageId && stageMap.has(stageId)) {
              const stageInfo = stageMap.get(stageId)!;
              enrichedStage = {
                id: stageInfo.id,
                name: stageInfo.name,
                category: stageInfo.category,
              };
            }
          }
          
          return {
            ...candidate,
            stage: enrichedStage,
            placements: enrichedPlacements,
            previous_offer_id: offerId,
            previous_offer_title: offer?.title || 'Onbekende vacature',
            previous_offer_company: offer?.company?.name || 'Onbekend Bedrijf',
          };
        });
      }
    } catch (error) {
      console.warn('[SILVER-MEDALISTS] Failed to fetch via candidates endpoint, trying per-offer method:', error);
      
      // Fallback: fetch per offer (slower but more reliable)
      // Fetch ALL offers with pagination
      console.log('[SILVER-MEDALISTS] Fetching all offers with pagination...');
      const allOffers: RecruiteeJob[] = [];
      let offerPage = 1;
      let hasMoreOffers = true;
      
      while (hasMoreOffers) {
        const pageOffers = await fetchRecruiteeJobs({ status: 'published', page: offerPage, perPage: 100 });
        console.log(`[SILVER-MEDALISTS] Offer page ${offerPage}: ${pageOffers.length} offers`);
        
        if (pageOffers.length === 0) {
          hasMoreOffers = false;
        } else {
          allOffers.push(...pageOffers);
          if (pageOffers.length < 100) {
            hasMoreOffers = false;
          } else {
            offerPage++;
          }
        }
        
        // Safety limit
        if (offerPage > 20) {
          console.warn(`[SILVER-MEDALISTS] Reached offer page limit (20 pages)`);
          hasMoreOffers = false;
        }
      }
      
      const offers = allOffers;
      console.log(`[SILVER-MEDALISTS] Total offers: ${offers.length}, fetching candidates per offer...`);
      
      const BATCH_SIZE = 10;
      for (let i = 0; i < offers.length; i += BATCH_SIZE) {
        const batch = offers.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (offer) => {
          try {
            // Try both methods
            let candidates = await fetchCandidatesForOffer(offer.id);
            if (candidates.length === 0) {
              candidates = await fetchRecruiteeCandidates({ offerId: offer.id, perPage: 100 });
            }
            
            // Enrich with stage names
            return candidates.map(candidate => {
              const candidateAny = candidate as any;
              const placements = candidateAny.placements || [];
              const enrichedPlacements = placements.map((placement: any) => {
                const stageId = placement.stage_id || placement.stageId || placement.stage?.id;
                if (stageId && stageMap.has(stageId)) {
                  const stageInfo = stageMap.get(stageId)!;
                  return {
                    ...placement,
                    stage: {
                      id: stageInfo.id,
                      name: stageInfo.name,
                      category: stageInfo.category,
                    },
                  };
                }
                return placement;
              });
              
              let enrichedStage = candidate.stage;
              if (!enrichedStage) {
                const stageId = candidateAny.stage_id || candidateAny.current_stage_id;
                if (stageId && stageMap.has(stageId)) {
                  const stageInfo = stageMap.get(stageId)!;
                  enrichedStage = {
                    id: stageInfo.id,
                    name: stageInfo.name,
                    category: stageInfo.category,
                  };
                }
              }
              
              return {
                ...candidate,
                stage: enrichedStage,
                placements: enrichedPlacements,
                previous_offer_id: offer.id,
                previous_offer_title: offer.title,
                previous_offer_company: offer.company?.name || 'Onbekend Bedrijf',
              };
            });
          } catch (error) {
            console.warn(`[SILVER-MEDALISTS] Error fetching candidates for offer ${offer.id}:`, error);
            return [];
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(candidates => {
          allCandidates.push(...candidates);
        });
      }
    }
    
    console.log(`[SILVER-MEDALISTS] Fetched ${allCandidates.length} total candidates`);
    
    // Filter for Silver Medalists: NOT hired but reached late stages
    // Changed logic: We don't require "disqualified" status - just "not hired" + "late stage"
    const silverMedalists: SilverMedalistCandidate[] = [];
    const candidateMap = new Map<number, SilverMedalistCandidate>();
    
    let candidatesWithLateStage = 0;
    let candidatesHired = 0;
    let candidatesNotHired = 0;
    
    for (const candidate of allCandidates) {
      const candidateAny = candidate as any;
      const placements = candidateAny.placements || [];
      
      // Skip if hired
      if (candidateAny.is_hired || candidate.hired_at) {
        candidatesHired++;
        continue;
      }
      
      candidatesNotHired++;
      
      // Check placements for late stages
      let furthestStage: { id: number; name: string; category?: string } | null = null;
      let furthestStageDate: string | null = null;
      
      for (const placement of placements) {
        const placementStage = placement.stage || placement;
        const placementStageName = placementStage?.name?.toLowerCase() || '';
        
        // Check if this is a late stage
        if (isLateStage(placementStageName)) {
          candidatesWithLateStage++;
          // This is a late stage - check if it's further than current furthest
          if (!furthestStage || 
              (placement.updated_at && (!furthestStageDate || placement.updated_at > furthestStageDate))) {
            furthestStage = {
              id: placementStage?.id || placement.stage_id || 0,
              name: placementStage?.name || '',
              category: placementStage?.category,
            };
            furthestStageDate = placement.updated_at || placement.created_at || null;
          }
        }
      }
      
      // Also check current stage
      if (candidate.stage && isLateStage(candidate.stage.name)) {
        if (!furthestStage) {
          candidatesWithLateStage++;
        }
        if (!furthestStage || 
            (candidate.updated_at && (!furthestStageDate || candidate.updated_at > furthestStageDate))) {
          furthestStage = {
            id: candidate.stage.id,
            name: candidate.stage.name,
            category: candidate.stage.category,
          };
          furthestStageDate = candidate.updated_at || candidate.created_at || null;
        }
      }
      
      // Silver Medalist: NOT hired + reached late stage
      // We don't require explicit "disqualified" status anymore
      if (furthestStage) {
        const existing = candidateMap.get(candidate.id);
        
        // Keep the candidate with the most recent late stage
        if (!existing || (furthestStageDate && (!existing.furthest_stage_date || furthestStageDate > existing.furthest_stage_date))) {
          const silverMedalist: SilverMedalistCandidate = {
            ...candidate,
            furthest_stage: furthestStage,
            furthest_stage_date: furthestStageDate || undefined,
            previous_offer_id: candidate.offer_id || candidateAny.previous_offer_id,
            previous_offer_title: candidateAny.offer_title || candidateAny.previous_offer_title,
            previous_offer_company: candidateAny.offer_company || candidateAny.previous_offer_company,
          };
          
          candidateMap.set(candidate.id, silverMedalist);
        }
      }
    }
    
    console.log(`[SILVER-MEDALISTS] Stats:`, {
      totalCandidates: allCandidates.length,
      hired: candidatesHired,
      notHired: candidatesNotHired,
      withLateStage: candidatesWithLateStage,
      silverMedalists: candidateMap.size,
    });
    
    return Array.from(candidateMap.values());
  } catch (error) {
    console.error('[SILVER-MEDALISTS] Error fetching Silver Medalist candidates:', error);
    throw error;
  }
}

/**
 * Synoniemen mapping voor functietitels
 * Dit helpt om vergelijkbare functies te matchen
 */
const JOB_TITLE_SYNONYMS: Record<string, string[]> = {
  // Developer/Engineer synoniemen
  'developer': ['engineer', 'programmer', 'coder', 'ontwikkelaar'],
  'engineer': ['developer', 'programmer', 'coder', 'ingenieur'],
  'programmer': ['developer', 'engineer', 'coder'],
  'coder': ['developer', 'engineer', 'programmer'],
  'ontwikkelaar': ['developer', 'engineer', 'programmer'],
  'ingenieur': ['engineer', 'developer'],
  
  // Frontend synoniemen
  'frontend': ['front-end', 'frontend', 'front end', 'client-side', 'ui'],
  'front-end': ['frontend', 'front end', 'client-side', 'ui'],
  'frontend': ['front-end', 'front end', 'client-side', 'ui'],
  'ui': ['frontend', 'front-end', 'user interface', 'interface'],
  'ux': ['user experience', 'usability', 'designer'],
  
  // Backend synoniemen
  'backend': ['back-end', 'backend', 'back end', 'server-side', 'api'],
  'back-end': ['backend', 'back end', 'server-side', 'api'],
  'backend': ['back-end', 'back end', 'server-side', 'api'],
  'api': ['backend', 'back-end', 'rest', 'graphql'],
  
  // Fullstack synoniemen
  'fullstack': ['full-stack', 'full stack', 'fullstack'],
  'full-stack': ['fullstack', 'full stack'],
  'fullstack': ['full-stack', 'full stack'],
  
  // Senior/Junior/medior niveaus
  'senior': ['sr', 'lead', 'principal', 'experienced'],
  'junior': ['jr', 'entry', 'starter', 'beginner'],
  'medior': ['mid', 'middle', 'intermediate'],
  'lead': ['senior', 'principal', 'tech lead'],
  'principal': ['senior', 'lead', 'architect'],
  
  // Manager synoniemen
  'manager': ['lead', 'head', 'director', 'supervisor'],
  'lead': ['manager', 'head', 'supervisor'],
  'head': ['manager', 'director', 'lead'],
  
  // Designer synoniemen
  'designer': ['design', 'ui designer', 'ux designer'],
  'design': ['designer', 'ui', 'ux'],
  
  // Analyst synoniemen
  'analyst': ['analist', 'specialist', 'consultant'],
  'analist': ['analyst', 'specialist'],
  'specialist': ['analyst', 'expert', 'consultant'],
  
  // Consultant synoniemen
  'consultant': ['consultant', 'advisor', 'specialist'],
  'advisor': ['consultant', 'specialist'],
  
  // Architect synoniemen
  'architect': ['architect', 'solution architect', 'system architect'],
  'solution': ['architect', 'designer'],
  
  // Tech stack synoniemen
  'javascript': ['js', 'typescript', 'node'],
  'typescript': ['javascript', 'ts', 'node'],
  'react': ['reactjs', 'react.js'],
  'angular': ['angularjs', 'angular.js'],
  'vue': ['vuejs', 'vue.js'],
  'node': ['nodejs', 'node.js'],
  'python': ['py'],
  'java': ['java'],
  'c#': ['csharp', 'c sharp'],
  'c++': ['cpp', 'c plus plus'],
  '.net': ['dotnet', 'dot net'],
};

/**
 * Expand keywords with synoniemen
 */
function expandKeywordsWithSynonyms(keywords: string[]): string[] {
  const expanded = new Set<string>();
  
  for (const keyword of keywords) {
    // Add original keyword
    expanded.add(keyword);
    
    // Add synoniemen if they exist
    const synonyms = JOB_TITLE_SYNONYMS[keyword];
    if (synonyms) {
      synonyms.forEach(syn => expanded.add(syn));
    }
    
    // Also check reverse: if any synonym maps to this keyword
    for (const [key, syns] of Object.entries(JOB_TITLE_SYNONYMS)) {
      if (syns.includes(keyword)) {
        expanded.add(key);
        syns.forEach(syn => expanded.add(syn));
      }
    }
  }
  
  return Array.from(expanded);
}

/**
 * Normalize text for better matching (remove special chars, normalize spaces)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Extract meaningful keywords from job title
 * Includes both individual words and common job title patterns
 */
function extractKeywords(title: string): string[] {
  const normalized = normalizeText(title);
  
  // Split into words
  const words = normalized
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out very short words
    .filter(word => !['voor', 'van', 'met', 'een', 'het', 'de', 'en', 'of', 'the', 'a', 'an', 'and', 'or'].includes(word)); // Filter stop words
  
  // Also extract common patterns (e.g., "front-end developer" -> ["front-end", "developer", "frontend developer"])
  const patterns: string[] = [];
  
  // Check for hyphenated terms and add both versions
  words.forEach(word => {
    if (word.includes('-')) {
      patterns.push(word.replace(/-/g, ' ')); // "front-end" -> "front end"
      patterns.push(word.replace(/-/g, '')); // "front-end" -> "frontend"
    }
  });
  
  // Add common job title combinations
  if (words.length >= 2) {
    // Add bigrams (two-word combinations)
    for (let i = 0; i < words.length - 1; i++) {
      patterns.push(`${words[i]} ${words[i + 1]}`);
    }
  }
  
  return [...words, ...patterns];
}

/**
 * Calculate match score between job title and candidate title
 * Returns a score from 0-1 indicating how well they match
 */
function calculateMatchScore(
  jobKeywords: string[],
  candidateTitle: string,
  candidateTags: string[]
): number {
  const candidateTitleNormalized = normalizeText(candidateTitle);
  const candidateTagsNormalized = candidateTags.map(tag => normalizeText(tag));
  
  let score = 0;
  let matches = 0;
  
  for (const keyword of jobKeywords) {
    const keywordLower = keyword.toLowerCase();
    
    // Check exact match in title (higher weight)
    if (candidateTitleNormalized.includes(keywordLower)) {
      score += 2;
      matches++;
    }
    // Check partial match (word boundary)
    else if (new RegExp(`\\b${keywordLower}\\w*`, 'i').test(candidateTitleNormalized)) {
      score += 1.5;
      matches++;
    }
    // Check in tags
    else if (candidateTagsNormalized.some(tag => tag.includes(keywordLower))) {
      score += 1;
      matches++;
    }
  }
  
  // Normalize score (0-1 range)
  if (jobKeywords.length === 0) return 0;
  const normalizedScore = Math.min(score / (jobKeywords.length * 2), 1);
  
  // Bonus for multiple matches
  const matchRatio = matches / jobKeywords.length;
  return (normalizedScore * 0.7) + (matchRatio * 0.3);
}

/**
 * Matches Silver Medalist candidates to a job based on title keywords and tags
 * Now includes synoniemen matching and fuzzy matching for similar titles
 */
export function matchCandidatesToJob(
  candidates: SilverMedalistCandidate[],
  jobTitle: string,
  jobTags?: string[]
): SilverMedalistCandidate[] {
  if (!jobTitle) return [];
  
  // Extract keywords from job title
  const titleKeywords = extractKeywords(jobTitle);
  
  // Expand with synoniemen
  const expandedKeywords = expandKeywordsWithSynonyms(titleKeywords);
  
  // Combine with tags
  const allKeywords = [...expandedKeywords];
  if (jobTags) {
    jobTags.forEach(tag => {
      const tagKeywords = extractKeywords(tag);
      allKeywords.push(...tagKeywords);
    });
  }
  
  // Remove duplicates
  const uniqueKeywords = Array.from(new Set(allKeywords));
  
  // Match candidates with scoring
  const matched: Array<{ candidate: SilverMedalistCandidate; score: number }> = [];
  
  for (const candidate of candidates) {
    const candidateTitle = candidate.previous_offer_title || '';
    const candidateTags = (candidate as any).tags || [];
    
    // Calculate match score
    const score = calculateMatchScore(uniqueKeywords, candidateTitle, candidateTags);
    
    // Only include if score is above threshold (0.2 = at least some match)
    if (score > 0.2) {
      matched.push({ candidate, score });
    }
  }
  
  // Sort by score (highest first), then by date
  matched.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) > 0.1) {
      return scoreDiff > 0 ? 1 : -1;
    }
    // If scores are similar, sort by date
    const dateA = a.candidate.furthest_stage_date ? new Date(a.candidate.furthest_stage_date).getTime() : 0;
    const dateB = b.candidate.furthest_stage_date ? new Date(b.candidate.furthest_stage_date).getTime() : 0;
    return dateB - dateA;
  });
  
  return matched.map(m => m.candidate);
}

