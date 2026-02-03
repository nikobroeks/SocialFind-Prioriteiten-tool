'use client';

import { Building2, Briefcase, LogOut } from 'lucide-react';
import { LogoutButton } from './logout-button';

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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">SocialFind</h1>
                <p className="text-xs text-gray-500 -mt-0.5">Prioriteiten Dashboard</p>
              </div>
            </div>
          </div>

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
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}

