'use client';

import { LayoutGrid, Columns3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'kanban' | 'compact';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const views: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: 'table', icon: LayoutGrid, label: 'Tabel' },
    { mode: 'kanban', icon: Columns3, label: 'Kanban' },
    { mode: 'compact', icon: List, label: 'Compact' },
  ];

  return (
    <div 
      className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-sm"
      role="tablist"
      aria-label="Weergave modus selectie"
    >
      {views.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          role="tab"
          aria-selected={currentView === mode}
          aria-controls={`${mode}-view`}
          className={cn(
            'inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
            currentView === mode
              ? 'bg-white text-orange-600 shadow-sm font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
          aria-label={`${label} weergave`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

