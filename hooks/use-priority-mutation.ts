import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertPriority } from '@/lib/supabase/queries';
import { PriorityFormData } from '@/types/dashboard';
import { VacancyPriority } from '@/types/database';
import { calculatePriority } from '@/lib/utils';
import { useNotifications } from '@/contexts/notifications-context';

interface UsePriorityMutationProps {
  jobId: number;
  companyId: number;
  onSuccess?: () => void;
}

export function usePriorityMutation({ jobId, companyId, onSuccess }: UsePriorityMutationProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: async (formData: PriorityFormData) => {
      return await upsertPriority(jobId, companyId, formData);
    },
    // Optimistic update
    onMutate: async (newPriorityData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['priorities'] });

      // Snapshot the previous value
      const previousPriorities = queryClient.getQueryData<VacancyPriority[]>(['priorities']);

      // Optimistically update to the new value
      const calculatedPriority = calculatePriority(
        newPriorityData.strategy_score,
        newPriorityData.hiring_chance,
        newPriorityData.client_pain
      );

      const optimisticPriority: VacancyPriority = {
        id: `temp-${jobId}-${companyId}`, // Temporary ID for optimistic update
        recruitee_job_id: jobId,
        recruitee_company_id: companyId,
        strategy_score: newPriorityData.strategy_score,
        hiring_chance: newPriorityData.hiring_chance,
        client_pain: newPriorityData.client_pain,
        calculated_priority: calculatedPriority,
        manual_override: newPriorityData.manual_override,
        notes: newPriorityData.notes,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_by: null, // Will be set by server
      };

      // Update the cache optimistically
      queryClient.setQueryData<VacancyPriority[]>(['priorities'], (old = []) => {
        const filtered = old.filter(
          (p) => !(p.recruitee_job_id === jobId && p.recruitee_company_id === companyId)
        );
        return [...filtered, optimisticPriority];
      });

      // Return context with the snapshotted value
      return { previousPriorities };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newPriority, context) => {
      if (context?.previousPriorities) {
        queryClient.setQueryData(['priorities'], context.previousPriorities);
      }
      addNotification({
        type: 'error',
        title: 'Opslaan mislukt',
        message: 'Er is een fout opgetreden bij het opslaan van de prioriteit',
      });
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['priorities'] });
    },
    onSuccess: (data) => {
      addNotification({
        type: 'success',
        title: 'Prioriteit opgeslagen',
        message: 'Prioriteit is succesvol bijgewerkt',
      });
      onSuccess?.();
    },
  });
}

