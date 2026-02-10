'use client';

import { Download, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { VacancyWithPriority, CompanyGroup } from '@/types/dashboard';
import { exportVacanciesToCSV, exportCompaniesToCSV, exportAllDataToCSV } from '@/lib/export-utils';
import { useNotifications } from '@/contexts/notifications-context';

interface ExportButtonProps {
  vacancies?: VacancyWithPriority[];
  companyGroups?: CompanyGroup[];
  variant?: 'default' | 'icon';
}

export function ExportButton({ vacancies, companyGroups, variant = 'default' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { addNotification } = useNotifications();

  const handleExportVacancies = () => {
    if (!vacancies || vacancies.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Geen vacatures',
        message: 'Er zijn geen vacatures om te exporteren',
      });
      return;
    }

    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      exportVacanciesToCSV(vacancies, `vacatures-${timestamp}.csv`);
      addNotification({
        type: 'success',
        title: 'Export succesvol',
        message: `${vacancies.length} vacature(s) geëxporteerd`,
      });
    } catch (error) {
      console.error('Export error:', error);
      addNotification({
        type: 'error',
        title: 'Export mislukt',
        message: 'Er is een fout opgetreden bij het exporteren van vacatures',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCompanies = () => {
    if (!companyGroups || companyGroups.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Geen bedrijven',
        message: 'Er zijn geen bedrijven om te exporteren',
      });
      return;
    }

    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      exportCompaniesToCSV(companyGroups, `bedrijven-${timestamp}.csv`);
      addNotification({
        type: 'success',
        title: 'Export succesvol',
        message: `${companyGroups.length} bedrijf/bedrijven geëxporteerd`,
      });
    } catch (error) {
      console.error('Export error:', error);
      addNotification({
        type: 'error',
        title: 'Export mislukt',
        message: 'Er is een fout opgetreden bij het exporteren van bedrijven',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = () => {
    if (!companyGroups || companyGroups.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Geen data',
        message: 'Er is geen data om te exporteren',
      });
      return;
    }

    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      exportAllDataToCSV(companyGroups, `complete-export-${timestamp}.csv`);
      const totalVacancies = companyGroups.reduce((sum, group) => sum + group.vacancies.length, 0);
      addNotification({
        type: 'success',
        title: 'Export succesvol',
        message: `Alle data geëxporteerd (${companyGroups.length} bedrijven, ${totalVacancies} vacatures)`,
      });
    } catch (error) {
      console.error('Export error:', error);
      addNotification({
        type: 'error',
        title: 'Export mislukt',
        message: 'Er is een fout opgetreden bij het exporteren van data',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCompaniesJobs = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/companies-jobs');
      if (!response.ok) {
        throw new Error('Failed to export companies and jobs');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `bedrijven-en-jobs-${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addNotification({
        type: 'success',
        title: 'Export succesvol',
        message: 'Bedrijven en jobs geëxporteerd',
      });
    } catch (error) {
      console.error('Export error:', error);
      addNotification({
        type: 'error',
        title: 'Export mislukt',
        message: 'Er is een fout opgetreden bij het exporteren van bedrijven en jobs',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (variant === 'icon') {
    return (
      <div className="relative group">
        <button
          onClick={handleExportAll}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
          title="Exporteer data naar CSV"
        >
          <Download className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={handleExportAll}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
      >
        <Download className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
        <span className="hidden sm:inline">Export CSV</span>
      </button>

      {/* Dropdown menu */}
      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="py-1">
          <button
            onClick={handleExportVacancies}
            disabled={!vacancies || vacancies.length === 0}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Vacatures
          </button>
          <button
            onClick={handleExportCompanies}
            disabled={!companyGroups || companyGroups.length === 0}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Bedrijven
          </button>
          <button
            onClick={handleExportAll}
            disabled={!companyGroups || companyGroups.length === 0}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-t border-gray-200"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Alles
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={handleExportCompaniesJobs}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Bedrijven & Jobs (voor review)
          </button>
        </div>
      </div>
    </div>
  );
}

