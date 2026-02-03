import { NextResponse } from 'next/server';

/**
 * Test endpoint om Recruitee Candidates API te testen
 */
export async function GET(request: Request) {
  const RECRUITEE_API_KEY = process.env.RECRUITEE_API_KEY;
  const RECRUITEE_COMPANY_ID = process.env.RECRUITEE_COMPANY_ID;
  const RECRUITEE_API_BASE_URL = 'https://api.recruitee.com';

  const results: any = {
    credentials: {
      apiKey: RECRUITEE_API_KEY ? '✅ Set' : '❌ Missing',
      companyId: RECRUITEE_COMPANY_ID ? '✅ Set' : '❌ Missing',
      companyIdValue: RECRUITEE_COMPANY_ID || 'Not set',
    },
    tests: [],
  };

  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    return NextResponse.json({
      ...results,
      error: 'Missing credentials',
    });
  }

  // Haal eerst een offer ID op om te testen
  let testOfferId: number | null = null;
  try {
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
        testOfferId = offers[0].id;
      }
    }
  } catch (error) {
    console.warn('Could not fetch test offer ID');
  }

  // Test verschillende candidate endpoints
  const endpointsToTest: Array<{ name: string; url: string }> = [
    { name: 'Candidates (standard)', url: `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/candidates?per_page=5` },
    { name: 'Candidates (with stage)', url: `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/candidates?stage=hire&per_page=5` },
    { name: 'Candidates (all stages)', url: `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/candidates?per_page=10` },
  ];

  // Voeg offer-specifieke endpoints toe als we een offer ID hebben
  if (testOfferId) {
    endpointsToTest.push(
      { name: `Candidates for Offer ${testOfferId}`, url: `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers/${testOfferId}/candidates` },
      { name: `Candidates for Offer ${testOfferId} (with pagination)`, url: `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers/${testOfferId}/candidates?per_page=10` }
    );
  }

  for (const endpoint of endpointsToTest) {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const status = response.status;
      let responseData: any = null;
      
      if (response.ok) {
        responseData = await response.json();
      } else {
        const errorText = await response.text();
        try {
          responseData = JSON.parse(errorText);
        } catch {
          responseData = { error: errorText };
        }
      }

      results.tests.push({
        name: endpoint.name,
        status: status === 200 ? '✅ Success' : status === 404 ? '❌ Not Found' : `⚠️ Status ${status}`,
        statusCode: status,
        url: endpoint.url,
        response: responseData,
        responseStructure: responseData ? Object.keys(responseData) : [],
        sampleData: responseData && Array.isArray(responseData) 
          ? responseData[0] 
          : responseData?.candidates?.[0] 
          ? responseData.candidates[0] 
          : responseData?.data?.candidates?.[0]
          ? responseData.data.candidates[0]
          : null,
      });
    } catch (error: any) {
      results.tests.push({
        name: endpoint.name,
        status: '❌ Error',
        error: error.message,
        url: endpoint.url,
      });
    }
  }

  return NextResponse.json(results);
}

