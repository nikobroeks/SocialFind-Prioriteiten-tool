'use client';

import { useState, useRef, useEffect } from 'react';
import { VacancyWithPriority } from '@/types/dashboard';
import { TalentPoolGoldmine } from './talent-pool-goldmine';
import { X } from 'lucide-react';

interface TalentPoolModalProps {
  vacancy: VacancyWithPriority;
  isOpen: boolean;
  onClose: () => void;
}

export function TalentPoolModal({ vacancy, isOpen, onClose }: TalentPoolModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstButton = modalRef.current.querySelector('button') as HTMLElement;
      firstButton?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation - ESC to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-gray-900">
              Potential Goldmine - {vacancy.job.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Kandidaten die eerder laat in het proces kwamen maar niet werden aangenomen
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            aria-label="Sluit dialoog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <TalentPoolGoldmine
            jobId={vacancy.job.id}
            jobTitle={vacancy.job.title}
            jobTags={(vacancy.job as any).tags}
            companyId={vacancy.company.id}
            enabled={true}
          />
        </div>
      </div>
    </div>
  );
}

