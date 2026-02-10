import { NextResponse } from 'next/server';
import { fetchRecruiteeJobs } from '@/lib/recruitee';

/**
 * GET /api/recruitee/test-tags
 * Test endpoint om te kijken welke tags/labels Recruitee jobs hebben
 */
export async function GET() {
  try {
    // Haal een paar jobs op om te zien welke velden er zijn
    const jobs = await fetchRecruiteeJobs({ status: 'published', perPage: 5 });
    
    // Analyseer de structuur van de eerste job
    const sampleJob = jobs[0];
    
    if (!sampleJob) {
      return NextResponse.json({ 
        error: 'No jobs found',
        message: 'Could not fetch any jobs from Recruitee API'
      });
    }
    
    // Haal alle keys op van het job object
    const jobKeys = Object.keys(sampleJob);
    
    // Zoek naar tag-gerelateerde velden
    const tagRelatedKeys = jobKeys.filter(key => 
      key.toLowerCase().includes('tag') || 
      key.toLowerCase().includes('label') ||
      key.toLowerCase().includes('category')
    );
    
    // Haal tag data op als die bestaat
    const tagData: any = {};
    tagRelatedKeys.forEach(key => {
      tagData[key] = (sampleJob as any)[key];
    });
    
    // Check ook in nested objects
    const nestedTagData: any = {};
    if ((sampleJob as any).company) {
      const companyKeys = Object.keys((sampleJob as any).company);
      companyKeys.forEach(key => {
        if (key.toLowerCase().includes('tag') || key.toLowerCase().includes('label')) {
          nestedTagData[`company.${key}`] = (sampleJob as any).company[key];
        }
      });
    }
    
    return NextResponse.json({
      message: 'Tags analysis for Recruitee jobs',
      totalJobs: jobs.length,
      sampleJob: {
        id: sampleJob.id,
        title: sampleJob.title,
        company_id: sampleJob.company_id,
        company: sampleJob.company,
        // Toon alle velden die mogelijk tags bevatten
        allKeys: jobKeys,
        tagRelatedKeys: tagRelatedKeys,
        tagData: tagData,
        nestedTagData: nestedTagData,
        // Toon volledige job structuur (beperkt)
        fullStructure: {
          ...sampleJob,
          // Limiteer grote arrays/objects
          _truncated: 'Full structure available, check tagData and nestedTagData for tag info'
        }
      },
      allJobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        // Check voor tags in elke job
        tags: (job as any).tags || (job as any).labels || (job as any).tag_ids || null,
        tagNames: (job as any).tag_names || (job as any).label_names || null,
        // Check voor andere mogelijke tag velden
        customFields: Object.keys(job).filter(k => 
          k.toLowerCase().includes('tag') || 
          k.toLowerCase().includes('label') ||
          k.toLowerCase().includes('category')
        ).reduce((acc: any, key) => {
          acc[key] = (job as any)[key];
          return acc;
        }, {})
      }))
    });
  } catch (error: any) {
    console.error('Error testing Recruitee tags:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test tags', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

