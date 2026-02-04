import { NextResponse } from 'next/server';
import { fetchRecruiteeJobs, fetchRecruiteeCandidates, fetchCandidatesForOffer, fetchSilverMedalistCandidates } from '@/lib/recruitee';

/**
 * Debug endpoint to see what's happening with Silver Medalist detection
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    
    const debug: any = {
      timestamp: new Date().toISOString(),
      steps: [],
    };
    
    // Step 1: Fetch offers
    debug.steps.push({ step: 1, action: 'Fetching offers...' });
    const offers = await fetchRecruiteeJobs({ status: 'published', perPage: limit });
    debug.steps.push({ 
      step: 2, 
      action: 'Offers fetched', 
      count: offers.length,
      sampleOffers: offers.slice(0, 3).map(o => ({ id: o.id, title: o.title }))
    });
    
    if (offers.length === 0) {
      return NextResponse.json({ ...debug, error: 'No offers found' });
    }
    
    // Step 2: Fetch candidates for first few offers to get better sample
    const testOffers = offers.slice(0, Math.min(limit, 10));
    debug.steps.push({ step: 3, action: `Fetching candidates for ${testOffers.length} offers...` });
    
    let allTestCandidates: any[] = [];
    const offerResults: any[] = [];
    
    for (const offer of testOffers) {
      try {
        debug.steps.push({ step: 3.1, action: `Fetching candidates for offer ${offer.id} (${offer.title})...` });
        
        // Try method 1: fetchCandidatesForOffer
        let candidates = await fetchCandidatesForOffer(offer.id);
        
        // If no candidates, try method 2: fetchRecruiteeCandidates with offerId
        if (candidates.length === 0) {
          debug.steps.push({ step: 3.2, action: `No candidates via fetchCandidatesForOffer, trying fetchRecruiteeCandidates...` });
          candidates = await fetchRecruiteeCandidates({ offerId: offer.id, perPage: 100 });
        }
        
        offerResults.push({
          offerId: offer.id,
          offerTitle: offer.title,
          candidateCount: candidates.length,
          hasCandidates: candidates.length > 0,
          sampleCandidate: candidates.length > 0 ? {
            id: candidates[0].id,
            name: candidates[0].name,
            stage: candidates[0].stage,
            is_hired: (candidates[0] as any).is_hired,
          } : null,
        });
        allTestCandidates.push(...candidates.map((c: any) => ({
          ...c,
          offer_id: offer.id,
          offer_title: offer.title,
        })));
      } catch (error: any) {
        offerResults.push({
          offerId: offer.id,
          offerTitle: offer.title,
          error: error.message,
          stack: error.stack,
        });
        debug.steps.push({ step: 3.5, action: `Error fetching candidates for offer ${offer.id}`, error: error.message });
      }
    }
    
    debug.offerResults = offerResults;
    const candidates = allTestCandidates;
    debug.steps.push({ 
      step: 4, 
      action: 'Candidates fetched', 
      count: candidates.length,
      sampleCandidates: candidates.slice(0, 5).map((c: any) => ({
        id: c.id,
        name: c.name,
        is_hired: c.is_hired,
        hired_at: c.hired_at,
        stage: c.stage,
        placements: c.placements?.slice(0, 2).map((p: any) => ({
          stage_id: p.stage_id,
          stage: p.stage,
          hired_at: p.hired_at,
        })),
        current_placement: c.current_placement,
      }))
    });
    
    // Step 3: Analyze candidates
    const analysis = {
      total: candidates.length,
      hired: 0,
      notHired: 0,
      withLateStage: 0,
      lateStageNames: [] as string[],
      stageCategories: {} as Record<string, number>,
      stageNames: {} as Record<string, number>,
    };
    
    candidates.forEach((candidate: any) => {
      if (candidate.is_hired || candidate.hired_at) {
        analysis.hired++;
      } else {
        analysis.notHired++;
      }
      
      // Check stage
      if (candidate.stage) {
        const cat = candidate.stage.category || 'unknown';
        const name = candidate.stage.name || 'unknown';
        analysis.stageCategories[cat] = (analysis.stageCategories[cat] || 0) + 1;
        analysis.stageNames[name] = (analysis.stageNames[name] || 0) + 1;
      }
      
      // Check placements
      if (candidate.placements) {
        candidate.placements.forEach((p: any) => {
          const stageName = p.stage?.name?.toLowerCase() || '';
          if (stageName.includes('hiring manager') || 
              stageName.includes('offer') || 
              stageName.includes('final') ||
              stageName.includes('eindgesprek') ||
              stageName.includes('aanbod')) {
            analysis.withLateStage++;
            if (!analysis.lateStageNames.includes(p.stage?.name)) {
              analysis.lateStageNames.push(p.stage?.name);
            }
          }
        });
      }
    });
    
    debug.analysis = analysis;
    
    // Step 4: Test actual Silver Medalist function
    try {
      debug.steps.push({ step: 5, action: 'Testing fetchSilverMedalistCandidates...' });
      const silverMedalists = await fetchSilverMedalistCandidates();
      debug.silverMedalists = {
        count: silverMedalists.length,
        sample: silverMedalists.slice(0, 3).map(sm => ({
          id: sm.id,
          name: sm.name,
          furthest_stage: sm.furthest_stage,
          previous_offer_title: sm.previous_offer_title,
        })),
      };
    } catch (error: any) {
      debug.silverMedalists = {
        error: error.message,
        stack: error.stack,
      };
    }
    
    return NextResponse.json(debug);
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

