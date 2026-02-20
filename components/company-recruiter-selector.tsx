'use client';

import { useState, useRef, useEffect } from 'react';
import { setCompanyRecruiters } from '@/lib/supabase/queries';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/contexts/notifications-context';
import { ChevronDown, User, Users } from 'lucide-react';

const RECRUITER_OPTIONS = ['Ken', 'Sam', 'Lois', 'Fatih', 'Just', 'Maris', 'Ylin', 'Sieme'] as const;

interface CompanyRecruiterSelectorProps {
  companyId: number;
  companyName: string;
  currentRecruiter?: string | null;
  currentBuddy?: string | null;
  isAdmin: boolean;
}

export function CompanyRecruiterSelector({
  companyId,
  companyName,
  currentRecruiter,
  currentBuddy,
  isAdmin,
}: CompanyRecruiterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recruiter, setRecruiter] = useState<string | null>(currentRecruiter || null);
  const [buddy, setBuddy] = useState<string | null>(currentBuddy || null);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSave = async () => {
    if (!isAdmin) return;

    setIsSaving(true);
    try {
      await setCompanyRecruiters(companyId, companyName, recruiter, buddy);
      
      addNotification({
        type: 'success',
        title: 'Succesvol',
        message: 'Recruiter en buddy bijgewerkt',
      });

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['companyRecruiters', companyId, companyName],
      });

      setIsOpen(false);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Fout',
        message: error.message || 'Er is een fout opgetreden bij het opslaan',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    // For non-admins, just show the recruiter and buddy as badges
    return (
      <div className="flex items-center gap-2">
        {recruiter && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full">
            <User className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">{recruiter}</span>
          </div>
        )}
        {buddy && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-full">
            <Users className="h-3 w-3 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">{buddy}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        title="Recruiter en buddy beheren"
      >
        <User className="h-3.5 w-3.5" />
        {recruiter || buddy ? (
          <span className="hidden sm:inline">
            {recruiter && buddy ? `${recruiter} + ${buddy}` : recruiter || buddy}
          </span>
        ) : (
          <span className="hidden sm:inline">Toewijzen</span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 space-y-4">
            {/* Recruiter Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Recruiter
              </label>
              <select
                value={recruiter || ''}
                onChange={(e) => setRecruiter(e.target.value || null)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Geen</option>
                {RECRUITER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Buddy Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Buddy
              </label>
              <select
                value={buddy || ''}
                onChange={(e) => setBuddy(e.target.value || null)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Geen</option>
                {RECRUITER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                {isSaving ? 'Opslaan...' : 'Opslaan'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

