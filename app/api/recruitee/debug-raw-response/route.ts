import { NextResponse } from 'next/server';

/**
 * GET /api/recruitee/debug-raw-response
 * Debug endpoint om de RAW Recruitee API response te zien
 * Dit helpt om te zien waar tags precies zitten in de response
 */
export async function GET() {
  const RECRUITEE_API_KEY = process.env.RECRUITEE_API_KEY;
  const RECRUITEE_COMPANY_ID = process.env.RECRUITEE_COMPANY_ID;
  const RECRUITEE_API_BASE_URL = 'https://api.recruitee.com';

  if (!RECRUITEE_API_KEY || !RECRUITEE_COMPANY_ID) {
    return NextResponse.json({ 
      error: 'Missing credentials',
      message: 'RECRUITEE_API_KEY or RECRUITEE_COMPANY_ID not set'
    }, { status: 500 });
  }

  try {
    // Haal RAW response op
    const url = `${RECRUITEE_API_BASE_URL}/c/${RECRUITEE_COMPANY_ID}/offers?status=published&per_page=3`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${RECRUITEE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: 'API request failed',
        status: response.status,
        statusText: response.statusText,
        body: errorText
      }, { status: response.status });
    }

    const responseData = await response.json();
    
    // Analyseer de eerste offer in detail
    const firstOffer = Array.isArray(responseData) 
      ? responseData[0] 
      : responseData.offers?.[0] 
      || responseData.jobs?.[0]
      || responseData.data?.offers?.[0]
      || responseData.data?.jobs?.[0]
      || null;

    if (!firstOffer) {
      return NextResponse.json({
        error: 'No offers found',
        responseStructure: Object.keys(responseData),
        responseData: responseData
      });
    }

    // Analyseer alle keys van de eerste offer
    const offerKeys = Object.keys(firstOffer);
    
    // Zoek naar tag-gerelateerde velden
    const tagKeys = offerKeys.filter(k => 
      k.toLowerCase().includes('tag') || 
      k.toLowerCase().includes('label') ||
      k.toLowerCase().includes('category')
    );

    // Check ook in nested objects
    const nestedTagInfo: any = {};
    Object.keys(firstOffer).forEach(key => {
      const value = firstOffer[key];
      if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
        const nestedKeys = Object.keys(value);
        const nestedTagKeys = nestedKeys.filter(k => 
          k.toLowerCase().includes('tag') || 
          k.toLowerCase().includes('label')
        );
        if (nestedTagKeys.length > 0) {
          nestedTagInfo[key] = {
            keys: nestedKeys,
            tagKeys: nestedTagKeys,
            values: nestedTagKeys.reduce((acc: any, k) => {
              acc[k] = value[k];
              return acc;
            }, {})
          };
        }
      }
    });

    return NextResponse.json({
      message: 'RAW Recruitee API response analysis',
      url: url.replace(RECRUITEE_API_KEY, '***'),
      responseStructure: {
        isArray: Array.isArray(responseData),
        topLevelKeys: Object.keys(responseData),
        hasOffers: 'offers' in responseData,
        hasJobs: 'jobs' in responseData,
        hasData: 'data' in responseData,
        offersCount: Array.isArray(responseData) 
          ? responseData.length 
          : responseData.offers?.length || responseData.jobs?.length || 0
      },
      firstOffer: {
        id: firstOffer.id,
        title: firstOffer.title,
        allKeys: offerKeys,
        tagRelatedKeys: tagKeys,
        tagValues: tagKeys.reduce((acc: any, key) => {
          acc[key] = firstOffer[key];
          return acc;
        }, {}),
        nestedTagInfo: nestedTagInfo,
        // Toon volledige structuur (beperkt tot eerste niveau)
        fullStructure: Object.keys(firstOffer).reduce((acc: any, key) => {
          const value = firstOffer[key];
          // Limiteer grote arrays/objects
          if (Array.isArray(value)) {
            acc[key] = `[Array(${value.length})]`;
            if (value.length > 0 && value.length <= 5) {
              acc[`${key}_sample`] = value.slice(0, 2);
            }
          } else if (value && typeof value === 'object' && value !== null) {
            acc[key] = `[Object] keys: ${Object.keys(value).join(', ')}`;
            if (Object.keys(value).length <= 10) {
              acc[`${key}_content`] = value;
            }
          } else {
            acc[key] = value;
          }
          return acc;
        }, {})
      },
      // Toon ook de volledige response voor eerste offer (voor debugging)
      rawFirstOffer: firstOffer
    });
  } catch (error: any) {
    console.error('Error fetching RAW Recruitee response:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch RAW response', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

