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

  const results: any = {
    tests: [],
  };

  try {
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
            results.candidateFromOffer = {
              sample: candidates[0],
              allKeys: Object.keys(candidates[0]),
              hasOfferId: !!candidates[0].offer_id,
              hasOffer: !!candidates[0].offer,
              hasOffers: !!candidates[0].offers,
              offerId: candidates[0].offer_id,
              offer: candidates[0].offer,
              offers: candidates[0].offers,
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
        results.directCandidate = {
          sample: directCandidates[0],
          allKeys: Object.keys(directCandidates[0]),
          hasOfferId: !!directCandidates[0].offer_id,
          hasOffer: !!directCandidates[0].offer,
          hasOffers: !!directCandidates[0].offers,
          offerId: directCandidates[0].offer_id,
          offer: directCandidates[0].offer,
          offers: directCandidates[0].offers,
        };
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}

