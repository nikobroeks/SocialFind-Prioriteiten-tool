import { NextResponse } from 'next/server';
import { fetchSilverMedalistCandidates, fetchRecruiteeJob } from '@/lib/recruitee';
import { matchCandidates } from '@/lib/job-matching-ai';

/**
 * API route to fetch Silver Medalist candidates matched to a specific job
 * GET /api/recruitee/silver-medalists?jobId=123&jobTitle=Software Engineer
 */
export async function GET(request: Request) {
  try {
    console.log('[SILVER-MEDALISTS] API call started');
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const jobTitle = searchParams.get('jobTitle') || '';
    const jobTags = searchParams.get('jobTags')?.split(',').filter(Boolean);
    
    console.log('[SILVER-MEDALISTS] Params:', { jobId, jobTitle, jobTags });
    
    if (!jobId || !jobTitle) {
      return NextResponse.json(
        { error: 'jobId and jobTitle are required' },
        { status: 400 }
      );
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('[SILVER-MEDALISTS] OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to .env.local' },
        { status: 500 }
      );
    }
    
    console.log('[SILVER-MEDALISTS] OpenAI API key found, fetching candidates...');
    
    // Fetch all Silver Medalist candidates
    const allSilverMedalists = await fetchSilverMedalistCandidates();
    console.log(`[SILVER-MEDALISTS] Found ${allSilverMedalists.length} Silver Medalist candidates`);
    
    if (allSilverMedalists.length === 0) {
      return NextResponse.json({
        candidates: [],
        total: 0,
        jobId: parseInt(jobId),
        jobTitle,
        matchingMethod: 'ai',
        message: 'No Silver Medalist candidates found',
      });
    }
    
    // Fetch job details from Recruitee to get full description
    const jobIdNum = parseInt(jobId);
    console.log(`[SILVER-MEDALISTS] Fetching job details for job ${jobIdNum}...`);
    let jobDescription = null;
    try {
      const jobDetails = await fetchRecruiteeJob(jobIdNum);
      jobDescription = jobDetails ? ((jobDetails as any).description || (jobDetails as any).requirements || null) : null;
      console.log(`[SILVER-MEDALISTS] Job description: ${jobDescription ? 'Found' : 'Not found'}`);
    } catch (error) {
      console.warn('[SILVER-MEDALISTS] Could not fetch job details:', error);
    }
    
    // Use AI matching (required, no fallback)
    console.log('[SILVER-MEDALISTS] Starting AI matching...');
    console.log(`[SILVER-MEDALISTS] Matching ${allSilverMedalists.length} Silver Medalists to job: "${jobTitle}" (ID: ${jobIdNum})`);
    
    const matched = await matchCandidates(
      allSilverMedalists,
      jobTitle,
      jobIdNum,
      jobDescription
    );
    
    console.log(`[SILVER-MEDALISTS] AI matching completed: ${matched.length} matches found (out of ${allSilverMedalists.length} candidates)`);
    
    if (matched.length === 0 && allSilverMedalists.length > 0) {
      console.warn(`[SILVER-MEDALISTS] ⚠️ No matches found, but ${allSilverMedalists.length} Silver Medalists available. AI may be filtering too strictly.`);
      console.log(`[SILVER-MEDALISTS] Sample candidate titles:`, allSilverMedalists.slice(0, 5).map(c => ({
        name: c.name,
        previous_offer_title: c.previous_offer_title,
        furthest_stage: c.furthest_stage?.name,
      })));
    }
    
    return NextResponse.json({
      candidates: matched.map(m => ({
        ...m.candidate,
        matchScore: m.score,
        matchReasoning: m.reasoning,
      })),
      total: matched.length,
      jobId: jobIdNum,
      jobTitle,
      matchingMethod: 'ai',
    });
  } catch (error: any) {
    console.error('[SILVER-MEDALISTS] Error:', error);
    console.error('[SILVER-MEDALISTS] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch Silver Medalist candidates',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

