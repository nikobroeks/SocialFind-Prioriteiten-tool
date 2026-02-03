import { NextResponse } from 'next/server';

/**
 * Test endpoint om Recruitee API credentials te valideren
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

  // Test 1: Try to fetch jobs - test multiple endpoint formats
  const endpointsToTest = [
    { name: 'Standard format', url: `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/jobs?status=published&per_page=5` },
    { name: 'Companies format', url: `${RECRUITEE_API_BASE_URL}/companies/${RECRUITEE_COMPANY_ID}/offers?status=published&per_page=5` },
    { name: 'Offers format', url: `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers?status=published&per_page=5` },
  ];

  for (const endpoint of endpointsToTest) {
    try {
      const jobsResponse = await fetch(endpoint.url, {
        headers: {
          'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const jobsData = await jobsResponse.json();
      
      results.tests.push({
        name: `Fetch Jobs (${endpoint.name})`,
        status: jobsResponse.ok ? '✅ Success' : '❌ Failed',
        statusCode: jobsResponse.status,
        url: endpoint.url.replace(RECRUITEE_API_KEY!, '***'),
        response: jobsResponse.ok ? {
          jobsCount: Array.isArray(jobsData) ? jobsData.length : jobsData.jobs?.length || jobsData.offers?.length || 0,
          firstJob: (Array.isArray(jobsData) ? jobsData[0] : jobsData.jobs?.[0] || jobsData.offers?.[0]) || null,
          responseStructure: Object.keys(jobsData),
        } : { error: jobsData },
      });

      // Als deze werkt, stop met testen
      if (jobsResponse.ok) {
        break;
      }
    } catch (error: any) {
      results.tests.push({
        name: `Fetch Jobs (${endpoint.name})`,
        status: '❌ Error',
        error: error.message,
      });
    }
  }

  // Test 2: Try to fetch a specific job (if we have one)
  try {
    const testJobId = 1; // Try with ID 1
    const jobResponse = await fetch(
      `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/jobs/${testJobId}`,
      {
        headers: {
          'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (jobResponse.ok) {
      const jobData = await jobResponse.json();
      results.tests.push({
        name: 'Fetch Single Job',
        status: '✅ Success',
        jobData: {
          id: jobData.id,
          title: jobData.title,
          company_id: jobData.company_id,
          hasCompany: !!jobData.company,
          company: jobData.company,
          allKeys: Object.keys(jobData),
        },
      });
    } else {
      results.tests.push({
        name: 'Fetch Single Job',
        status: `⚠️ Status ${jobResponse.status}`,
        note: 'Job ID 1 might not exist, this is normal',
      });
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Fetch Single Job',
      status: '❌ Error',
      error: error.message,
    });
  }

  return NextResponse.json(results);
}

