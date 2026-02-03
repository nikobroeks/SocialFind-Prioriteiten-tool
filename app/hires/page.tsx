'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { Calendar, TrendingUp, Users, Briefcase, ChevronDown, ChevronUp, BarChart3, PieChart } from 'lucide-react';

interface Hire {
  id: number;
  name: string;
  hired_at?: string;
  created_at?: string;
  offer_id?: number;
  offer_title?: string;
  offer_company?: string;
  stage?: {
    id: number;
    name: string;
    category?: string;
  };
  [key: string]: unknown;
}

interface Application extends Hire {}

interface HireStats {
  totalCandidates: number;
  hiresFound: number;
  notFound: number;
  byHiredAt: number;
  byStageId: number;
  byPlacementStageId: number;
  byCurrentPlacementStageId: number;
  byStageCategory: number;
  byPlacementCategory: number;
  byStageName: number;
  byPlacementStageName: number;
  noMatchSample: Array<{
    id: number;
    name: string;
    reason: string;
    data: any;
  }>;
}

async function fetchData(month?: number, year?: number, includeApplications = true): Promise<{ 
  applications: Application[]; 
  hires: Hire[];
  applicationsCount: number;
  hiresCount: number;
  stats?: HireStats;
}> {
  let url = '/api/recruitee/hires?include_applications=true';
  if (month !== undefined && year !== undefined) {
    url += `&month=${month}&year=${year}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch data');
  }
  return response.json();
}

const monthNames = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

export default function HiresPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'hires' | 'applications'>('hires');
  const [collapsedCompanies, setCollapsedCompanies] = useState<Set<string>>(new Set());

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['hires-applications', selectedMonth, selectedYear, viewMode],
    queryFn: () => fetchData(viewMode === 'year' ? undefined : selectedMonth || undefined, selectedYear, true),
    staleTime: 10 * 60 * 1000, // Data is 10 minuten "fresh" voordat het opnieuw wordt opgehaald
    gcTime: 30 * 60 * 1000, // Cache blijft 30 minuten bestaan
    refetchOnWindowFocus: false, // Herhaal niet automatisch bij window focus
    refetchOnMount: false, // Herhaal niet bij mount als data al in cache zit
    refetchOnReconnect: false, // Herhaal niet bij reconnect
  });

  const allHires = data?.hires || [];
  const allApplications = data?.applications || [];
  const stats = data?.stats;
  
  // Filter op jaar/maand (client-side extra check) - gebruik placement.hired_at eerst!
  const hires = allHires.filter((hire: Hire) => {
    const hireAny = hire as any;
    const placements = hireAny.placements || [];
    
    // Gebruik placement.hired_at eerst, dan hire.hired_at, dan updated_at
    const dateStr = (placements.length > 0 && placements[0].hired_at) 
                  || hire.hired_at 
                  || hire.updated_at;
    
    if (!dateStr || typeof dateStr !== 'string') return false;
    const date = new Date(dateStr);
    
    // Filter altijd op jaar
    const yearMatches = date.getFullYear() === selectedYear;
    
    // Als maand view is geselecteerd, filter ook op maand
    if (viewMode === 'month' && selectedMonth !== null) {
      return yearMatches && date.getMonth() === selectedMonth;
    }
    
    return yearMatches;
  });

  const applications = allApplications.filter((app: Application) => {
    const dateStr = app.created_at || app.updated_at;
    if (!dateStr || typeof dateStr !== 'string') return false;
    const date = new Date(dateStr);
    return date.getFullYear() === selectedYear;
  });

  const totalHires = hires.length;
  const totalApplications = applications.length;

  // Toggle functie voor inklappen/uitklappen van bedrijven
  const toggleCompany = (companyName: string) => {
    setCollapsedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyName)) {
        newSet.delete(companyName);
      } else {
        newSet.add(companyName);
      }
      return newSet;
    });
  };

  // Bereken statistieken
  const hiresByCompany = hires.reduce((acc: Record<string, number>, hire: Hire) => {
    const companyName = hire.offer_company || 'Onbekend Bedrijf';
    acc[companyName] = (acc[companyName] || 0) + 1;
    return acc;
  }, {});

  const applicationsByCompany = applications.reduce((acc: Record<string, number>, app: Application) => {
    const companyName = app.offer_company || 'Onbekend Bedrijf';
    acc[companyName] = (acc[companyName] || 0) + 1;
    return acc;
  }, {});

  // Bereken maandelijkse statistieken voor jaar overzicht
  const monthlyStats = monthNames.map((monthName, monthIndex) => {
    const monthHires = hires.filter((hire: Hire) => {
      const dateStr = hire.hired_at || hire.updated_at;
      if (!dateStr || typeof dateStr !== 'string') return false;
      const date = new Date(dateStr);
      return date.getMonth() === monthIndex && date.getFullYear() === selectedYear;
    });
    
    const monthApplications = applications.filter((app: Application) => {
      const dateStr = app.created_at || app.updated_at;
      if (!dateStr || typeof dateStr !== 'string') return false;
      const date = new Date(dateStr);
      return date.getMonth() === monthIndex && date.getFullYear() === selectedYear;
    });

    return {
      month: monthName,
      monthIndex,
      hires: monthHires.length,
      applications: monthApplications.length,
      conversionRate: monthApplications.length > 0 
        ? ((monthHires.length / monthApplications.length) * 100).toFixed(1)
        : '0',
    };
  });

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader totalCompanies={0} totalVacancies={0} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hires & Sollicitaties Dashboard</h1>
          <p className="text-gray-600">Overzicht van sollicitaties en aangenomen kandidaten per maand</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setActiveTab('hires')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'hires'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4 w-4" />
              Hires ({totalHires})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'applications'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Sollicitaties ({totalApplications})
            </button>
          </div>
        </div>

        {/* View Mode Toggle & Month/Year Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'month'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Maand Overzicht
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'year'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Jaar Overzicht
              </button>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {viewMode === 'month' && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <label className="text-sm font-medium text-gray-700">Maand:</label>
                  <select
                    value={selectedMonth ?? ''}
                    onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {monthNames.map((name, index) => (
                      <option key={index} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Jaar:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {activeTab === 'hires' ? 'Totaal Hires' : 'Totaal Sollicitaties'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {activeTab === 'hires' ? totalHires : totalApplications}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {viewMode === 'month' && selectedMonth !== null
                    ? `${monthNames[selectedMonth]} ${selectedYear}`
                    : `Hele jaar ${selectedYear}`}
                </p>
              </div>
              <div className={`h-12 w-12 ${activeTab === 'hires' ? 'bg-green-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                <Users className={`h-6 w-6 ${activeTab === 'hires' ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bedrijven</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {activeTab === 'hires' 
                    ? Object.keys(hiresByCompany).length 
                    : Object.keys(applicationsByCompany).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeTab === 'hires' ? 'Met hires' : 'Met sollicitaties'} deze maand
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gemiddeld</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {activeTab === 'hires' 
                    ? (Object.keys(hiresByCompany).length > 0
                        ? (totalHires / Object.keys(hiresByCompany).length).toFixed(1)
                        : '0')
                    : (Object.keys(applicationsByCompany).length > 0
                        ? (totalApplications / Object.keys(applicationsByCompany).length).toFixed(1)
                        : '0')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeTab === 'hires' ? 'Hires' : 'Sollicitaties'} per bedrijf
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversie</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {totalApplications > 0
                    ? ((totalHires / totalApplications) * 100).toFixed(1)
                    : '0'}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Hire rate</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(isLoading || isFetching) && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600">
              {isLoading ? 'Data ophalen...' : 'Data bijwerken...'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Dit kan even duren bij de eerste keer laden
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6">
            <p className="font-semibold mb-2">Fout bij ophalen van data:</p>
            <p className="text-sm">{String(error)}</p>
            <p className="text-xs mt-2 text-red-600">
              Tip: Check de server console logs voor meer informatie over stage detectie
            </p>
          </div>
        )}


        {/* Charts Section - Professional Design */}
        {!isLoading && !error && (
          <div className="space-y-6">
            {/* Monthly Trend Bar Chart - Professional */}
            {viewMode === 'year' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Maandelijkse Trend</h3>
                  <p className="text-sm text-gray-500">Overzicht van {activeTab === 'hires' ? 'hires' : 'sollicitaties'} per maand in {selectedYear}</p>
                </div>
                
                <div className="relative">
                  {/* Y-axis labels - Dynamic based on actual max value */}
                  <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
                    {(() => {
                      const maxValue = Math.max(...monthlyStats.map(s => activeTab === 'hires' ? s.hires : s.applications), 1);
                      // Round up to nearest nice number (1, 2, 5, 10, 20, 50, 100, etc.)
                      const getNiceMax = (max: number) => {
                        if (max === 0) return 1;
                        const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                        const normalized = max / magnitude;
                        let nice;
                        if (normalized <= 1) nice = 1;
                        else if (normalized <= 2) nice = 2;
                        else if (normalized <= 5) nice = 5;
                        else nice = 10;
                        return nice * magnitude;
                      };
                      const niceMax = getNiceMax(maxValue);
                      const steps = 5;
                      const stepValue = niceMax / steps;
                      return Array.from({ length: steps + 1 }, (_, i) => steps - i).map(i => {
                        const labelValue = Math.round(i * stepValue);
                        return (
                          <div key={i} className="text-right">{labelValue}</div>
                        );
                      });
                    })()}
                  </div>
                  
                  {/* Chart area */}
                  <div className="ml-14">
                    <div className="relative h-64">
                      {/* Grid lines - More visible */}
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="absolute inset-x-0 border-t-2 border-gray-300" style={{ top: `${(i / 5) * 100}%` }} />
                      ))}
                      
                      {/* Bars container */}
                      <div className="absolute inset-0 grid grid-cols-12 gap-3 items-end">
                        {(() => {
                          const maxValue = Math.max(...monthlyStats.map(s => activeTab === 'hires' ? s.hires : s.applications), 1);
                          // Round up to nearest nice number for scaling
                          const getNiceMax = (max: number) => {
                            if (max === 0) return 1;
                            const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                            const normalized = max / magnitude;
                            let nice;
                            if (normalized <= 1) nice = 1;
                            else if (normalized <= 2) nice = 2;
                            else if (normalized <= 5) nice = 5;
                            else nice = 10;
                            return nice * magnitude;
                          };
                          const niceMax = getNiceMax(maxValue);
                          
                          return monthlyStats.map((stat, idx) => {
                            const value = activeTab === 'hires' ? stat.hires : stat.applications;
                            const height = niceMax > 0 ? (value / niceMax) * 100 : 0;
                            const barHeight = value > 0 ? Math.max(height, 2) : 0; // Minimum 2% height if value > 0
                            
                            return (
                              <div key={idx} className="flex flex-col items-center group z-10 h-full">
                                <div className="relative w-full h-full flex flex-col items-end justify-end">
                                  {/* Bar */}
                                  {value > 0 && (
                                    <div 
                                      className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${
                                        activeTab === 'hires'
                                          ? 'bg-gradient-to-t from-green-600 via-green-500 to-green-400 hover:from-green-700 hover:via-green-600 hover:to-green-500'
                                          : 'bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500'
                                      } shadow-sm hover:shadow-md group-hover:scale-105`}
                                      style={{ 
                                        height: `${barHeight}%`,
                                        minHeight: '8px'
                                      }}
                                    >
                                      {/* Value label on hover */}
                                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                        <div className="bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap">
                                          {value}
                                        </div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Month label */}
                                <div className="mt-2 text-xs font-medium text-gray-600 text-center">
                                  {stat.month.substring(0, 3)}
                                </div>
                                {/* Value below bar */}
                                <div className="mt-1 text-xs font-bold text-gray-900">
                                  {value}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Company Distribution - Modern Donut Chart */}
            {(Object.keys(activeTab === 'hires' ? hiresByCompany : applicationsByCompany).length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Verdeling per Bedrijf</h3>
                  <p className="text-sm text-gray-500">Top bedrijven met {activeTab === 'hires' ? 'hires' : 'sollicitaties'}</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Donut Chart */}
                  <div className="lg:col-span-1 flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      <svg viewBox="0 0 120 120" className="transform -rotate-90 w-full h-full">
                        {/* Background circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="20"
                        />
                        
                        {(() => {
                          const companies = Object.entries(activeTab === 'hires' ? hiresByCompany : applicationsByCompany)
                            .sort(([, a], [, b]) => (b as number) - (a as number));
                          const total = activeTab === 'hires' ? totalHires : totalApplications;
                          let currentAngle = 0;
                          // Generate colors dynamically for all companies
                          const baseColors = [
                            '#f97316', // orange
                            '#3b82f6', // blue
                            '#22c55e', // green
                            '#a855f7', // purple
                            '#ec4899', // pink
                            '#6366f1', // indigo
                            '#ef4444', // red
                            '#10b981', // emerald
                            '#f59e0b', // amber
                            '#8b5cf6', // violet
                            '#06b6d4', // cyan
                            '#ec4899', // pink
                          ];
                          const colors = companies.map((_, idx) => baseColors[idx % baseColors.length]);
                          
                          return companies.map(([company, count], idx) => {
                            const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                            const angle = (percentage / 100) * 360;
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            currentAngle += angle;
                            
                            const x1 = 60 + 50 * Math.cos((startAngle * Math.PI) / 180);
                            const y1 = 60 + 50 * Math.sin((startAngle * Math.PI) / 180);
                            const x2 = 60 + 50 * Math.cos((endAngle * Math.PI) / 180);
                            const y2 = 60 + 50 * Math.sin((endAngle * Math.PI) / 180);
                            const largeArc = angle > 180 ? 1 : 0;
                            
                            return (
                              <g key={company} className="group cursor-pointer">
                                <path
                                  d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={colors[idx % colors.length]}
                                  className="opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                                <title>{`${company}: ${count} (${percentage.toFixed(1)}%)`}</title>
                              </g>
                            );
                          });
                        })()}
                      </svg>
                      
                    </div>
                  </div>
                  
                  {/* Legend - Better styled */}
                  <div className="lg:col-span-2 space-y-3 max-h-96 overflow-y-auto">
                    {Object.entries(activeTab === 'hires' ? hiresByCompany : applicationsByCompany)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([company, count], idx) => {
                        const baseColors = [
                          'bg-orange-500',
                          'bg-blue-500',
                          'bg-green-500',
                          'bg-purple-500',
                          'bg-pink-500',
                          'bg-indigo-500',
                          'bg-red-500',
                          'bg-emerald-500',
                          'bg-amber-500',
                          'bg-violet-500',
                          'bg-cyan-500',
                          'bg-rose-500',
                        ];
                        const colors = baseColors;
                        const total = activeTab === 'hires' ? totalHires : totalApplications;
                        const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                        
                        return (
                          <div key={company} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className={`w-5 h-5 rounded ${colors[idx % colors.length]} flex-shrink-0 shadow-sm`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate" title={company}>
                                {company}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {percentage.toFixed(1)}% van totaal
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">
                                {count}
                              </div>
                              <div className="text-xs text-gray-500">
                                {activeTab === 'hires' ? 'hires' : 'sollicitaties'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Comparison - Clean Design */}
            {viewMode === 'month' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Trend Overzicht</h3>
                  <p className="text-sm text-gray-500">Vergelijking met voorgaande maanden</p>
                </div>
                
                <div className="space-y-3">
                  {monthlyStats
                    .filter((_, idx) => idx <= (selectedMonth ?? 0))
                    .slice(-6)
                    .map((stat, idx, arr) => {
                      const value = activeTab === 'hires' ? stat.hires : stat.applications;
                      const maxValue = Math.max(...arr.map(s => activeTab === 'hires' ? s.hires : s.applications), 1);
                      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                      const isCurrentMonth = idx === arr.length - 1;
                      const prevValue = idx > 0 ? (activeTab === 'hires' ? arr[idx - 1].hires : arr[idx - 1].applications) : null;
                      const change = prevValue !== null ? value - prevValue : null;
                      
                      return (
                        <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${
                          isCurrentMonth 
                            ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-white shadow-sm' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-semibold ${
                                isCurrentMonth ? 'text-orange-900' : 'text-gray-700'
                              }`}>
                                {stat.month}
                              </span>
                              {change !== null && change !== 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  change > 0 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {change > 0 ? '↑' : '↓'} {Math.abs(change)}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                isCurrentMonth ? 'text-orange-600' : 'text-gray-900'
                              }`}>
                                {value}
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCurrentMonth 
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                                  : activeTab === 'hires'
                                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                                  : 'bg-gradient-to-r from-blue-400 to-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {activeTab === 'hires' && totalHires === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Geen hires gevonden voor{' '}
                  {viewMode === 'month' && selectedMonth !== null
                    ? `${monthNames[selectedMonth]} ${selectedYear}`
                    : `jaar ${selectedYear}`}
                </p>
              </div>
            )}

            {activeTab === 'applications' && totalApplications === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Geen sollicitaties gevonden voor{' '}
                  {viewMode === 'month' && selectedMonth !== null
                    ? `${monthNames[selectedMonth]} ${selectedYear}`
                    : `jaar ${selectedYear}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* OLD DATA LIST - REMOVED */}
        {false && !isLoading && !error && (
          <div className="space-y-6">
            {activeTab === 'hires' ? (
              Object.keys(hiresByCompany).length > 0 ? (
                Object.entries(hiresByCompany)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([company, count]) => (
                    <div
                      key={company}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                        <button
                          onClick={() => toggleCompany(company)}
                          className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                              <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">{company}</h2>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {count} hire{count !== 1 ? 's' : ''} deze maand
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
                              {count}
                            </div>
                            {collapsedCompanies.has(company) ? (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </button>
                      </div>
                      {!collapsedCompanies.has(company) && (
                        <div className="p-6">
                        <div className="space-y-3">
                          {hires
                            .filter((hire: Hire) => {
                              const companyName = hire.offer_company || 'Onbekend Bedrijf';
                              return companyName === company;
                            })
                            .filter((hire: Hire) => {
                              // Filter op maand als maand view actief is
                              if (viewMode === 'month' && selectedMonth !== null) {
                                const dateStr = hire.hired_at || hire.updated_at;
                                if (!dateStr || typeof dateStr !== 'string') return false;
                                const date = new Date(dateStr);
                                return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
                              }
                              return true;
                            })
                            .map((hire: Hire) => (
                              <div
                                key={hire.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{hire.name}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    {hire.offer_title || 'Vacature onbekend'}
                                  </p>
                                  {hire.offer_title && hire.offer_title !== 'Vacature onbekend' && (
                                    <p className="text-xs text-gray-400 mt-1 italic">
                                      {hire.offer_company || 'Bedrijf onbekend'}
                                    </p>
                                  )}
                                  {(!hire.offer_title || hire.offer_title === 'Vacature onbekend') && (
                                    <p className="text-xs text-red-500 mt-1">
                                      ⚠️ Geen vacature informatie gevonden (Offer ID: {hire.offer_id || 'onbekend'})
                                    </p>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {hire.hired_at
                                    ? new Date(hire.hired_at).toLocaleDateString('nl-NL', {
                                        day: 'numeric',
                                        month: 'short',
                                      })
                                    : hire.updated_at && typeof hire.updated_at === 'string'
                                    ? new Date(hire.updated_at).toLocaleDateString('nl-NL', {
                                        day: 'numeric',
                                        month: 'short',
                                      })
                                    : '-'}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <p className="text-gray-600">
                    Geen hires gevonden voor{' '}
                    {viewMode === 'month' && selectedMonth !== null
                      ? `${monthNames[selectedMonth!]} ${selectedYear}`
                      : `jaar ${selectedYear}`}
                  </p>
                </div>
              )
            ) : (
              /* Applications by Company */
              Object.keys(applicationsByCompany).length > 0 ? (
                Object.entries(applicationsByCompany)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([company, count]) => (
                    <div
                      key={company}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                        <button
                          onClick={() => toggleCompany(company)}
                          className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                              <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">{company}</h2>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {count} sollicitatie{count !== 1 ? 's' : ''} deze maand
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
                              {count}
                            </div>
                            {collapsedCompanies.has(company) ? (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </button>
                      </div>
                      {!collapsedCompanies.has(company) && (
                        <div className="p-6">
                        <div className="space-y-3">
                          {applications
                            .filter((app: Application) => {
                              const companyName = app.offer_company || 'Onbekend Bedrijf';
                              return companyName === company;
                            })
                            .filter((app: Application) => {
                              // Filter op maand als maand view actief is
                              if (viewMode === 'month' && selectedMonth !== null) {
                                const dateStr = app.created_at || app.updated_at;
                                if (!dateStr || typeof dateStr !== 'string') return false;
                                const date = new Date(dateStr);
                                return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
                              }
                              return true;
                            })
                            .map((app: Application) => (
                              <div
                                key={app.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{app.name}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    {app.offer_title || 'Vacature onbekend'}
                                  </p>
                                  {app.stage && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Stage: {app.stage.name}
                                    </p>
                                  )}
                                  {app.offer_title && app.offer_title !== 'Vacature onbekend' && (
                                    <p className="text-xs text-gray-400 mt-1 italic">
                                      {app.offer_company || 'Bedrijf onbekend'}
                                    </p>
                                  )}
                                  {(!app.offer_title || app.offer_title === 'Vacature onbekend') && (
                                    <p className="text-xs text-red-500 mt-1">
                                      ⚠️ Geen vacature informatie gevonden (Offer ID: {app.offer_id || 'onbekend'})
                                    </p>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {app.created_at
                                    ? new Date(app.created_at).toLocaleDateString('nl-NL', {
                                        day: 'numeric',
                                        month: 'short',
                                      })
                                    : '-'}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <p className="text-gray-600">
                    Geen sollicitaties gevonden voor{' '}
                    {viewMode === 'month' && selectedMonth !== null
                      ? `${monthNames[selectedMonth!]} ${selectedYear}`
                      : `jaar ${selectedYear}`}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}

