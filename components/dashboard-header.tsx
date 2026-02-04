'use client';

import { Building2, Briefcase, TrendingUp, RefreshCw } from 'lucide-react';
import { LogoutButton } from './logout-button';
import { DataRefreshButton } from './data-refresh-button';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';

interface DashboardHeaderProps {
  totalCompanies: number;
  totalVacancies: number;
}

export function DashboardHeader({ totalCompanies, totalVacancies }: DashboardHeaderProps) {
  const queryClient = useQueryClient();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreAll = async () => {
    if (!confirm('Weet je zeker dat je alle verborgen vacatures weer zichtbaar wilt maken?')) {
      return;
    }

    setIsRestoring(true);
    try {
      const response = await fetch('/api/job-visibility/restore-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore hidden jobs');
      }

      const result = await response.json();
      if (result.restored.length > 0) {
        alert(`Success! ${result.restored.length} verborgen vacature${result.restored.length !== 1 ? 's' : ''} ${result.restored.length !== 1 ? 'zijn' : 'is'} weer zichtbaar gemaakt.`);
      } else {
        alert('Er zijn geen verborgen vacatures gevonden.');
      }
      
      // Refresh the dashboard
      await queryClient.invalidateQueries({ queryKey: ['job-visibility'] });
      await queryClient.invalidateQueries({ queryKey: ['recruiteeJobs'] });
    } catch (error: any) {
      alert(`Fout: ${error.message}`);
      console.error('Error restoring hidden jobs:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 min-h-[56px]">
          {/* Logo & Title */}
          <a 
            href="/" 
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-md"
            aria-label="Ga naar dashboard"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <Image
                  src="/socialfind-logo.png"
                  alt=""
                  fill
                  className="object-contain"
                  priority
                  aria-hidden="true"
                />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-base sm:text-lg font-bold text-gray-900">SocialFind</h1>
                <p className="text-xs text-gray-500 -mt-0.5">Prioriteiten Dashboard</p>
              </div>
            </div>
          </a>

          {/* Stats - Hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex items-center gap-4" aria-label="Statistieken">
            <div className="flex items-center gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{totalCompanies}</span> bedrijven
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Briefcase className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{totalVacancies}</span> vacatures
              </span>
            </div>
          </div>

          {/* Actions */}
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Hoofdnavigatie">
            <a
              href="/hires"
              className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Bekijk hires statistieken"
            >
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Hires</span>
            </a>
            <button
              onClick={handleRestoreAll}
              disabled={isRestoring}
              className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-sm font-medium text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors border border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Maak alle verborgen vacatures weer zichtbaar"
              aria-busy={isRestoring}
            >
              <RefreshCw className={`h-4 w-4 ${isRestoring ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">Alle zichtbaar maken</span>
            </button>
            <DataRefreshButton />
            <LogoutButton />
          </nav>
        </div>
      </div>
    </header>
  );
}

