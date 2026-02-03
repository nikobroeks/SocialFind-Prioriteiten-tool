import { NextResponse } from 'next/server';

/**
 * Debug endpoint om candidate data structuur te inspecteren
 */
export async function GET(request: Request) {
  const RECRUITEE_API_KEY = process.env.RECRUITEE_API_KEY;
  const RECRUITEE_COMPANY_ID = process.env.RECRUITEE_COMPANY_ID;
  const RECRUITEE_API_BASE_URL = 'https://api.recruitee.com';

  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    return NextResponse.json({ error: 'Missing credentials' });
  }

  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get('id') || '111573940'; // Nico Reinders default

  const results: any = {
    candidateId: candidateId,
    tests: [],
  };

  try {
    // Test 0: Haal specifieke candidate op (Nico Reinders)
    console.log(`[DEBUG] Fetching candidate ${candidateId}...`);
    try {
      const candidateResponse = await fetch(
        `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/candidates/${candidateId}`,
        {
          headers: {
            'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (candidateResponse.ok) {
        const candidateData = await candidateResponse.json();
        results.nicoReinders = {
          fullResponse: candidateData,
          candidate: candidateData.candidate,
          references: candidateData.references,
          candidateKeys: candidateData.candidate ? Object.keys(candidateData.candidate) : [],
          referencesCount: candidateData.references?.length || 0,
          // Check alle hire-gerelateerde velden
          hireFields: {
            isHired: candidateData.candidate?.isHired,
            hired_at: candidateData.candidate?.hired_at,
            placements: candidateData.candidate?.placements,
            placementsCount: candidateData.candidate?.placements?.length || 0,
            current_placement: candidateData.candidate?.current_placement,
            stage: candidateData.candidate?.stage,
            current_stage: candidateData.candidate?.current_stage,
            status: candidateData.candidate?.status,
            state: candidateData.candidate?.state,
          },
          // Check placements in detail
          placementsDetail: candidateData.candidate?.placements?.map((p: any, idx: number) => ({
            index: idx,
            id: p.id,
            offerId: p.offerId,
            offer_id: p.offer_id,
            stageId: p.stageId,
            stage_id: p.stage_id,
            stage: p.stage,
            hiredAt: p.hiredAt,
            hired_at: p.hired_at,
            hiredInThisPlacement: p.hiredInThisPlacement,
            allKeys: Object.keys(p),
          })) || [],
          // Check references voor stages
          stageReferences: candidateData.references?.filter((r: any) => r.type === 'Stage') || [],
        };
      } else {
        const errorText = await candidateResponse.text();
        results.nicoReinders = {
          error: `Failed to fetch candidate: ${candidateResponse.status}`,
          errorText: errorText,
        };
      }
    } catch (error: any) {
      results.nicoReinders = {
        error: error.message,
      };
    }

    // Test 1: Haal een offer op om te zien welke velden het heeft
    const offersResponse = await fetch(
      `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers?status=published&per_page=1`,
      {
        headers: {
          'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (offersResponse.ok) {
      const offersData = await offersResponse.json();
      const offers = offersData.offers || offersData.jobs || (Array.isArray(offersData) ? offersData : []);
      
      if (offers.length > 0) {
        const testOffer = offers[0];
        results.offerSample = {
          id: testOffer.id,
          title: testOffer.title,
          company: testOffer.company,
          allKeys: Object.keys(testOffer),
        };

        // Test 2: Haal candidates voor deze offer op
        const candidatesResponse = await fetch(
          `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers/${testOffer.id}/candidates?per_page=3`,
          {
            headers: {
              'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (candidatesResponse.ok) {
          const candidatesData = await candidatesResponse.json();
          const candidates = Array.isArray(candidatesData) 
            ? candidatesData 
            : candidatesData.candidates 
            ? candidatesData.candidates 
            : candidatesData.data?.candidates || [];

          if (candidates.length > 0) {
            const sample = candidates[0];
            results.candidateFromOffer = {
              sample: sample,
              allKeys: Object.keys(sample),
              hasOfferId: !!sample.offer_id,
              hasOffer: !!sample.offer,
              hasOffers: !!sample.offers,
              offerId: sample.offer_id,
              offer: sample.offer,
              offers: sample.offers,
              stage: sample.stage,
              stageName: sample.stage?.name,
              stageCategory: sample.stage?.category,
              stageId: sample.stage?.id,
              hiredAt: sample.hired_at,
              hasHiredAt: !!sample.hired_at,
              // Check alle mogelijke stage velden
              allStageFields: {
                stage: sample.stage,
                current_stage: (sample as any).current_stage,
                stage_id: (sample as any).stage_id,
                stage_name: (sample as any).stage_name,
                status: (sample as any).status,
                state: (sample as any).state,
              },
            };
          }
        }
      }
    }

    // Test 3: Haal direct candidates op
    const directCandidatesResponse = await fetch(
      `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/candidates?per_page=3`,
      {
        headers: {
          'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (directCandidatesResponse.ok) {
      const directCandidatesData = await directCandidatesResponse.json();
      const directCandidates = Array.isArray(directCandidatesData)
        ? directCandidatesData
        : directCandidatesData.candidates
        ? directCandidatesData.candidates
        : directCandidatesData.data?.candidates || [];

      if (directCandidates.length > 0) {
        const sample = directCandidates[0];
        results.directCandidate = {
          sample: sample,
          allKeys: Object.keys(sample),
          hasOfferId: !!sample.offer_id,
          hasOffer: !!sample.offer,
          hasOffers: !!sample.offers,
          offerId: sample.offer_id,
          offer: sample.offer,
          offers: sample.offers,
          stage: sample.stage,
          stageName: sample.stage?.name,
          stageCategory: sample.stage?.category,
          stageId: sample.stage?.id,
          hiredAt: sample.hired_at,
          hasHiredAt: !!sample.hired_at,
          // Check alle mogelijke stage velden
          allStageFields: {
            stage: sample.stage,
            current_stage: (sample as any).current_stage,
            stage_id: (sample as any).stage_id,
            stage_name: (sample as any).stage_name,
            status: (sample as any).status,
            state: (sample as any).state,
          },
        };
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}

