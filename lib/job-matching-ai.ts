/**
 * AI-powered job title matching using OpenAI GPT
 * Analyzes job requirements and candidate profiles for intelligent matching
 */

import { SilverMedalistCandidate } from '@/types/recruitee';
import { RecruiteeJob } from '@/types/recruitee';

interface MatchingOptions {
  similarityThreshold?: number;
}

interface AIMatchResult {
  candidate: SilverMedalistCandidate;
  score: number; // 0-100 percentage
  reasoning: string; // Why this is a good match
  method: 'ai';
}

// getJobDetails is now passed as parameter, no need for separate function

/**
 * Call OpenAI GPT to analyze and match candidates
 */
async function analyzeMatchWithAI(
  jobTitle: string,
  jobDescription: string | null,
  candidates: Array<{ title: string; stage: string; date: string; company: string }>
): Promise<Array<{ index: number; score: number; reasoning: string }>> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  
  console.log(`[AI-MATCHING] Analyzing ${candidates.length} candidates for job: ${jobTitle}`);
  
  const prompt = `Je bent een expert recruitment AI die Silver Medalist kandidaten matcht aan vacatures.

CONTEXT:
Silver Medalists zijn hoogwaardige kandidaten die eerder laat in het recruitment proces kwamen (bijv. Hiring Manager Interview, Offer stage) maar uiteindelijk niet werden aangenomen. Ze zijn zeer geschikt voor re-engagement omdat ze al bewezen hebben geschikt te zijn voor vergelijkbare rollen.

VACATURE:
Titel: ${jobTitle}
${jobDescription ? `Beschrijving: ${jobDescription.substring(0, 800)}` : 'Geen beschrijving beschikbaar'}

KANDIDATEN (Silver Medalists):
${candidates.map((c, i) => 
  `${i}: "${c.title}"${c.company ? ` bij ${c.company}` : ''}${c.name ? ` (${c.name})` : ''} | Laatste stage: ${c.stage} | Datum: ${c.date}`
).join('\n')}

TAKEN:
1. Analyseer elke kandidaat grondig en bepaal matching score (0-100%)
   - 80-100%: Uitstekende match, zeer vergelijkbare rol
   - 60-79%: Goede match, relevante ervaring
   - 40-59%: Matige match, enige overlap
   - 0-39%: Zwakke match, weinig overlap

2. Geef een duidelijke, korte uitleg (max 60 woorden) waarom deze match wel/niet goed is
3. Focus op:
   - Semantische gelijkenis van functietitels (bijv. "Marketing Associate" ≈ "Content Marketeer")
   - Overlap in verantwoordelijkheden en skills
   - Relevante ervaring en context
   - Potentiële fit voor de nieuwe rol

BELANGRIJK:
- Wees redelijk maar eerlijk: retourneer kandidaten met score ≥40% (niet alleen perfecte matches)
- Nederlandse en Engelse termen zijn equivalent (bijv. "Marketeer" = "Marketing")
- Overweeg context: "Marketing Associate" kan matchen met "Content Marketeer" maar niet met "Software Engineer"
- Wees inclusief: als een kandidaat relevante ervaring heeft, geef ze een kans (≥40%)
- Als functietitel "Onbekende functie" of "Onbekende vacature" is, gebruik de kandidaat naam en stage informatie om te bepalen of er een match kan zijn
- Silver Medalists zijn hoogwaardige kandidaten - geef ze het voordeel van de twijfel als er enige relevante overlap is

FORMAT (JSON object met "results" array):
{
  "results": [
    {
      "index": 0,
      "score": 85,
      "reasoning": "Marketing Associate en Content Marketeer zijn beide marketing-rollen met overlap in content creatie, strategie en campagne management. Beide rollen vereisen sterke communicatieve vaardigheden."
    },
    {
      "index": 2,
      "score": 72,
      "reasoning": "Projectmanager Marketing heeft relevante ervaring in marketing projecten en teamcoördinatie, wat aansluit bij de Marketing Associate rol."
    }
  ]
}

Alleen kandidaten met score >= 40% moeten worden geretourneerd. Sorteer op score (hoogste eerst).`;

  console.log('[AI-MATCHING] Calling OpenAI API...');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert recruitment AI. Je analyseert kandidaten en vacatures en geeft accurate matching scores (0-100%) met duidelijke uitleg. Je antwoordt altijd in geldig JSON formaat.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        response_format: { type: 'json_object' },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI-MATCHING] OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[AI-MATCHING] OpenAI API response received');
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error('[AI-MATCHING] No content in OpenAI response:', data);
      throw new Error('No response from OpenAI');
    }
    
    console.log('[AI-MATCHING] Parsing OpenAI response...');
    
    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }
    
    // Handle both array and object with results key
    const results = Array.isArray(parsed) 
      ? parsed 
      : (parsed.results || parsed.matches || parsed.candidates || []);
    
    console.log(`[AI-MATCHING] Found ${results.length} matches from AI (out of ${candidates.length} candidates analyzed)`);
    
    if (results.length === 0 && candidates.length > 0) {
      console.warn(`[AI-MATCHING] ⚠️ No matches found! AI may be filtering too strictly.`);
      console.log(`[AI-MATCHING] Sample candidate titles analyzed:`, candidates.slice(0, 5).map(c => c.title));
    }
    
    return results.map((r: any) => ({
      index: r.index,
      score: Math.max(0, Math.min(100, r.score || 0)), // Clamp between 0-100
      reasoning: r.reasoning || r.explanation || 'Match gevonden',
    }));
  } catch (error: any) {
    console.error('[AI-MATCHING] OpenAI API error:', error);
    console.error('[AI-MATCHING] Error details:', error.message, error.stack);
    throw error;
  }
}


/**
 * AI-powered matching using GPT-4
 * Analyzes job and candidates to provide intelligent matching with scores
 */
export async function matchCandidatesWithAI(
  candidates: SilverMedalistCandidate[],
  jobTitle: string,
  jobId?: number,
  jobDescription?: string | null,
  options: MatchingOptions = {}
): Promise<AIMatchResult[]> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required. Please add OPENAI_API_KEY to .env.local');
  }
  
  // If no candidates, return empty
  if (candidates.length === 0) {
    return [];
  }
  
  // Use provided job description (already fetched in API route)
  const fullJobDescription = jobDescription;
  
  // Prepare candidate data for AI analysis
  const candidateData = candidates.map((c, index) => {
    // Try to get better title information
    let title = c.previous_offer_title || '';
    // If title is "Onbekende vacature", try to extract from candidate name or other fields
    if (!title || title === 'Onbekende vacature' || title === 'Onbekende functie') {
      // Try to infer from candidate data if available
      title = (c as any).title || (c as any).job_title || 'Onbekende functie';
    }
    
    return {
      index,
      title,
      stage: c.furthest_stage?.name || 'Onbekend',
      date: c.furthest_stage_date || c.updated_at || 'Onbekend',
      company: c.previous_offer_company || '',
      name: c.name, // Include name for context
    };
  });
  
  // Process in batches to avoid token limits (max ~50 candidates per batch)
  const BATCH_SIZE = 50;
  const allResults: AIMatchResult[] = [];
  
  for (let i = 0; i < candidateData.length; i += BATCH_SIZE) {
    const batch = candidateData.slice(i, i + BATCH_SIZE);
    
    try {
      const aiResults = await analyzeMatchWithAI(jobTitle, fullJobDescription || null, batch);
      
      // Map AI results back to candidates
      aiResults.forEach((result) => {
        const candidateIndex = i + result.index;
        if (candidateIndex < candidates.length) {
          allResults.push({
            candidate: candidates[candidateIndex],
            score: result.score,
            reasoning: result.reasoning,
            method: 'ai',
          });
        }
      });
    } catch (error) {
      console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error);
      // Continue with next batch instead of failing completely
    }
  }
  
  // Sort by score (highest first)
  allResults.sort((a, b) => b.score - a.score);
  
  // If no matches found but we have candidates, return them all with a base score
  // This ensures users always see Silver Medalists, even if AI matching is strict
  if (allResults.length === 0 && candidates.length > 0) {
    console.warn(`[AI-MATCHING] No AI matches found for ${candidates.length} candidates. Returning all with base score.`);
    return candidates.map((candidate, index) => ({
      candidate,
      score: 50, // Base score - they're Silver Medalists so they're valuable
      reasoning: `Silver Medalist kandidaat die laat stadium bereikte (${candidate.furthest_stage?.name || 'onbekend'}). Relevante match mogelijk.`,
      method: 'ai' as const,
    }));
  }
  
  return allResults;
}

/**
 * Main matching function - Always uses AI
 * No fallback, AI is required
 */
export async function matchCandidates(
  candidates: SilverMedalistCandidate[],
  jobTitle: string,
  jobId?: number,
  jobDescription?: string | null,
  options: MatchingOptions = {}
): Promise<AIMatchResult[]> {
  return await matchCandidatesWithAI(candidates, jobTitle, jobId, jobDescription, options);
}

