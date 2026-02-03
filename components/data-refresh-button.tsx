'use client';

import { useState, useRef } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface RefreshProgress {
  step: number;
  progress: number;
  message: string;
  jobs?: number;
  hires?: number;
  applications?: number;
}

export function DataRefreshButton() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState<RefreshProgress | null>(null);
  const [completed, setCompleted] = useState(false);
  const animationRef = useRef<number | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setCompleted(false);
    setProgress({ step: 0, progress: 0, message: 'Initialiseren...' });

    const startTime = Date.now();
    const totalDuration = 3 * 60 * 1000; // 3 minutes total
    const stepDuration = totalDuration / 4; // ~45 seconds per step

    try {
      // Step 1: Jobs (0-25%)
      setProgress({ step: 1, progress: 0, message: 'Jobs ophalen...' });
      const step1Start = Date.now();
      const step1 = await fetch('/api/recruitee/preload-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1 }),
      });
      const step1Data = await step1.json();
      
      // Animate progress smoothly to 25%
      const animateStep1 = () => {
        const elapsed = Date.now() - step1Start;
        const progress = Math.min(25, (elapsed / stepDuration) * 25);
        setProgress({ ...step1Data, progress });
        if (progress < 25 && Date.now() - startTime < totalDuration) {
          animationRef.current = requestAnimationFrame(animateStep1);
        }
      };
      animateStep1();
      
      // Wait until step duration is reached
      const step1Elapsed = Date.now() - step1Start;
      if (step1Elapsed < stepDuration) {
        await new Promise(resolve => setTimeout(resolve, stepDuration - step1Elapsed));
      }
      setProgress({ ...step1Data, progress: 25 });

      // Step 2: Applications (25-50%)
      setProgress({ step: 2, progress: 25, message: 'Sollicitaties ophalen...' });
      const step2Start = Date.now();
      const step2 = await fetch('/api/recruitee/preload-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 2 }),
      });
      const step2Data = await step2.json();
      
      const animateStep2 = () => {
        const elapsed = Date.now() - step2Start;
        const progress = Math.min(50, 25 + (elapsed / stepDuration) * 25);
        setProgress({ ...step2Data, progress });
        if (progress < 50 && Date.now() - startTime < totalDuration) {
          animationRef.current = requestAnimationFrame(animateStep2);
        }
      };
      animateStep2();
      
      const step2Elapsed = Date.now() - step2Start;
      if (step2Elapsed < stepDuration) {
        await new Promise(resolve => setTimeout(resolve, stepDuration - step2Elapsed));
      }
      setProgress({ ...step2Data, progress: 50 });

      // Step 3: Hires (50-75%)
      setProgress({ step: 3, progress: 50, message: 'Hires ophalen...' });
      const step3Start = Date.now();
      const step3 = await fetch('/api/recruitee/preload-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 3 }),
      });
      const step3Data = await step3.json();
      
      const animateStep3 = () => {
        const elapsed = Date.now() - step3Start;
        const progress = Math.min(75, 50 + (elapsed / stepDuration) * 25);
        setProgress({ ...step3Data, progress });
        if (progress < 75 && Date.now() - startTime < totalDuration) {
          animationRef.current = requestAnimationFrame(animateStep3);
        }
      };
      animateStep3();
      
      const step3Elapsed = Date.now() - step3Start;
      if (step3Elapsed < stepDuration) {
        await new Promise(resolve => setTimeout(resolve, stepDuration - step3Elapsed));
      }
      setProgress({ ...step3Data, progress: 75 });

      // Step 4: Finalize (75-100%)
      setProgress({ step: 4, progress: 75, message: 'Afronden...' });
      const step4Start = Date.now();
      const step4 = await fetch('/api/recruitee/preload-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 4 }),
      });
      const step4Data = await step4.json();
      
      const animateStep4 = () => {
        const elapsed = Date.now() - step4Start;
        const totalElapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalDuration - totalElapsed);
        const progress = Math.min(100, 75 + ((stepDuration - remaining) / stepDuration) * 25);
        setProgress({ ...step4Data, progress });
        if (progress < 100 && totalElapsed < totalDuration) {
          animationRef.current = requestAnimationFrame(animateStep4);
        }
      };
      animateStep4();
      
      // Wait until total duration is reached
      const totalElapsed = Date.now() - startTime;
      if (totalElapsed < totalDuration) {
        await new Promise(resolve => setTimeout(resolve, totalDuration - totalElapsed));
      }
      
      setProgress({ ...step4Data, progress: 100 });
      setCompleted(true);
      
      // Invalidate all React Query caches to force refetch
      // This will trigger all queries to refetch and use the new cached data
      await queryClient.invalidateQueries();
      
      // Also explicitly refetch the main queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['hires-applications'] }),
        queryClient.refetchQueries({ queryKey: ['company-hires-90d'] }),
        queryClient.refetchQueries({ queryKey: ['recruitee-jobs'] }),
      ]);
      
      // Show success message for 3 seconds, then hide progress
      setTimeout(() => {
        setProgress(null);
        setCompleted(false);
      }, 3000);
    } catch (error: any) {
      console.error('Refresh error:', error);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setProgress({
        step: 0,
        progress: 0,
        message: `Fout: ${error.message || 'Onbekende fout'}`,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {isRefreshing && progress && (
        <div className="flex items-center gap-3 min-w-[250px]">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">{progress.message}</span>
              <span className="text-xs font-bold text-gray-900">{Math.round(progress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {completed && !isRefreshing && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Voltooid!</span>
        </div>
      )}

      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
          isRefreshing
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md'
        }`}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 'Laden...' : 'Data Refresh'}</span>
      </button>
    </div>
  );
}
