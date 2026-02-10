'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface CompanyVisibilityToggleButtonProps {
  companyId: number;
  companyName: string;
  isAdmin: boolean;
}

export function CompanyVisibilityToggleButton({ 
  companyId, 
  companyName,
  isAdmin 
}: CompanyVisibilityToggleButtonProps) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch company visibility settings
  const { data: visibilityData } = useQuery({
    queryKey: ['company-visibility'],
    queryFn: async () => {
      const response = await fetch('/api/company-visibility');
      if (!response.ok) throw new Error('Failed to fetch company visibility');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const visibility = visibilityData?.visibility || [];
  
  // Get visibility for this company
  const getCompanyVisibility = (): boolean => {
    const companyVisibility = visibility.find(
      (v: any) => v.recruitee_company_id === companyId && v.company_name === companyName
    );
    // Default to visible if no setting exists
    return companyVisibility ? companyVisibility.is_visible : true;
  };

  const isVisible = getCompanyVisibility();

  const handleToggle = async () => {
    if (!isAdmin || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/company-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          companyName,
          isVisible: !isVisible,
        }),
      });

      if (!response.ok) throw new Error('Failed to update company visibility');

      // Invalidate queries to refresh the UI
      await queryClient.invalidateQueries({ queryKey: ['company-visibility'] });
      await queryClient.invalidateQueries({ queryKey: ['recruiteeJobs'] });
    } catch (error) {
      console.error('Error updating company visibility:', error);
      alert('Fout bij bijwerken van bedrijf zichtbaarheid');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 ${
        isVisible
          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
      title={isVisible ? 'Bedrijf verbergen' : 'Bedrijf tonen'}
    >
      {isUpdating ? (
        <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : isVisible ? (
        <Eye className="h-3.5 w-3.5" />
      ) : (
        <EyeOff className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">
        {isVisible ? 'Zichtbaar' : 'Verborgen'}
      </span>
    </button>
  );
}

