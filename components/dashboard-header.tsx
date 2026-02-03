'use client';

import { Building2, Briefcase, TrendingUp } from 'lucide-react';
import { LogoutButton } from './logout-button';
import { DataRefreshButton } from './data-refresh-button';
import Image from 'next/image';

interface DashboardHeaderProps {
  totalCompanies: number;
  totalVacancies: number;
}

export function DashboardHeader({ totalCompanies, totalVacancies }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Title */}
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/socialfind-logo.png"
                  alt="SocialFind Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">SocialFind</h1>
                <p className="text-xs text-gray-500 -mt-0.5">Prioriteiten Dashboard</p>
              </div>
            </div>
          </a>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{totalCompanies}</span> bedrijven
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Briefcase className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{totalVacancies}</span> vacatures
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="/hires"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
              <TrendingUp className="h-4 w-4" />
              Hires
            </a>
            <DataRefreshButton />
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}

