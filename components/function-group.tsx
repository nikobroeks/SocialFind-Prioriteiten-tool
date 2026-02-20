'use client';

import { FunctionGroup as FunctionGroupType } from '@/types/dashboard';
import { VacancyRow } from './vacancy-row';
import { PriorityBadge } from './priority-badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { setFunctionCollapseState } from '@/lib/supabase/queries';
import { useQueryClient } from '@tanstack/react-query';

interface FunctionGroupProps {
  functionGroup: FunctionGroupType;
  companyId: number;
  companyName: string;
  userId: string;
  isAdmin: boolean;
  applicantsPerVacancy?: Record<string, number>;
  allCompanies?: Array<{ id: number; name: string }>;
  onCompanyAssign?: (jobId: number, companyName: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function FunctionGroup({
  functionGroup,
  companyId,
  companyName,
  userId,
  isAdmin,
  applicantsPerVacancy = {},
  allCompanies = [],
  onCompanyAssign,
  isCollapsed,
  onToggleCollapse,
}: FunctionGroupProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleToggleCollapse = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    const newCollapsedState = !isCollapsed;
    
    try {
      // Optimistically update UI
      onToggleCollapse();

      // Update database in background
      await setFunctionCollapseState(
        userId,
        companyId,
        companyName,
        functionGroup.title,
        newCollapsedState
      );

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['functionCollapseState', userId, companyId],
      });
    } catch (error) {
      console.error('Error updating collapse state:', error);
      // Revert optimistic update on error
      onToggleCollapse();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Function Header - Always visible */}
      <div
        className="px-6 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        onClick={handleToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {functionGroup.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {functionGroup.vacancies.length} vacature{functionGroup.vacancies.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={functionGroup.priority} />
          </div>
        </div>
      </div>

      {/* Vacancies - Only visible when expanded */}
      {!isCollapsed && (
        <div className="transition-all duration-200">
          <table className="w-full border-collapse table-fixed" role="table" aria-label={`Vacatures voor ${functionGroup.title}`}>
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[9%]" />
              <col className="w-[12%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[8%]" />
              {isAdmin && <col className="w-[10%]" />}
            </colgroup>
            <thead className="hidden sm:table-header-group">
              <tr className="bg-gray-50 border-b border-gray-200">
                <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Vacature</th>
                <th scope="col" className="text-center p-2 pr-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Sollicitanten</th>
                <th scope="col" className="text-left p-2 pl-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Klant pijn</th>
                <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Tijdkritiek</th>
                <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Strategie</th>
                <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Account</th>
                <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Prioriteit</th>
                {isAdmin && (
                  <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Acties</th>
                )}
              </tr>
            </thead>
            <tbody>
              {functionGroup.vacancies.map((vacancy) => {
                const applicantCount = applicantsPerVacancy[vacancy.job.id.toString()] || 0;
                return (
                  <VacancyRow
                    key={vacancy.job.id}
                    vacancy={vacancy}
                    isAdmin={isAdmin}
                    applicantCount={applicantCount}
                    allCompanies={allCompanies}
                    onCompanyAssign={onCompanyAssign}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

