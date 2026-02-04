'use client';

import { SilverMedalistCandidate } from '@/types/recruitee';
import { useSilverMedalists } from '@/hooks/use-silver-medalists';
import { Sparkles, ExternalLink, Calendar, Briefcase, Loader2, TrendingUp } from 'lucide-react';
// Simple date formatting without date-fns dependency
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('nl-NL', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};

interface TalentPoolGoldmineProps {
  jobId: number;
  jobTitle: string;
  jobTags?: string[];
  companyId?: number;
  enabled?: boolean;
}

/**
 * Component to display "Potential Goldmine" candidates (Silver Medalists)
 * Shows candidates who reached late stages but weren't hired
 */
export function TalentPoolGoldmine({
  jobId,
  jobTitle,
  jobTags,
  companyId,
  enabled = true,
}: TalentPoolGoldmineProps) {
  const { data, isLoading, error } = useSilverMedalists({
    jobId,
    jobTitle,
    jobTags,
    enabled,
  });
  
  if (!enabled) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Potential Goldmine</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Zoeken naar kandidaten...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Potential Goldmine</h3>
        </div>
        <div className="text-sm text-red-600 space-y-2">
          <p className="font-medium">Fout bij ophalen van kandidaten:</p>
          <p>{error.message}</p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-gray-500">Details</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
  
  const candidates = data?.candidates || [];
  
  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Potential Goldmine</h3>
        </div>
        <p className="text-sm text-gray-500">
          Geen geschikte kandidaten gevonden in de talent pool voor deze vacature.
        </p>
      </div>
    );
  }
  
  // Get Recruitee company ID from prop, environment, or use a fallback
  const getRecruiteeUrl = (candidateId: number) => {
    // Use companyId prop if provided, otherwise try environment variable
    const recruiteeCompanyId = companyId?.toString() || process.env.NEXT_PUBLIC_RECRUITEE_COMPANY_ID || '';
    if (recruiteeCompanyId) {
      return `https://app.recruitee.com/c/${recruiteeCompanyId}/candidates/${candidateId}`;
    }
    // Fallback: use candidate ID only (user can navigate manually)
    return `https://app.recruitee.com/candidates/${candidateId}`;
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Potential Goldmine</h3>
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            {candidates.length}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Kandidaten die eerder laat in het proces kwamen maar niet werden aangenomen:
      </p>
      
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-yellow-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900 truncate">
                    {candidate.name}
                  </h4>
                  {candidate.matchScore !== undefined && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: candidate.matchScore >= 80 ? '#dcfce7' : candidate.matchScore >= 60 ? '#fef3c7' : '#fee2e2',
                        color: candidate.matchScore >= 80 ? '#166534' : candidate.matchScore >= 60 ? '#92400e' : '#991b1b',
                      }}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {candidate.matchScore}% match
                    </div>
                  )}
                </div>
                
                {candidate.matchReasoning && (
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
                    <span className="font-medium">💡 Match reden: </span>
                    {candidate.matchReasoning}
                  </div>
                )}
                
                <div className="space-y-1.5 text-sm text-gray-600">
                  {candidate.furthest_stage && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span>
                        Laatste stage: <span className="font-medium text-gray-900">
                          {candidate.furthest_stage.name}
                        </span>
                      </span>
                    </div>
                  )}
                  
                  {candidate.furthest_stage_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span>
                        Datum: <span className="font-medium text-gray-900">
                          {formatDate(candidate.furthest_stage_date)}
                        </span>
                      </span>
                    </div>
                  )}
                  
                  {candidate.previous_offer_title && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Vorige vacature: <span className="font-medium text-gray-700">
                          {candidate.previous_offer_title}
                        </span>
                        {candidate.previous_offer_company && (
                          <span className="text-gray-500"> bij {candidate.previous_offer_company}</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={getRecruiteeUrl(candidate.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors border border-orange-200"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Bekijk profiel
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

