import { PriorityColor } from '@/types/database';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: PriorityColor;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const styles = {
    Red: 'bg-red-50 text-red-700 border-red-200 shadow-sm',
    Orange: 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm',
    Green: 'bg-green-50 text-green-700 border-green-200 shadow-sm',
  };

  const labels = {
    Red: 'Hoog',
    Orange: 'Medium',
    Green: 'Laag',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold border',
        styles[priority],
        className
      )}
    >
      {labels[priority]}
    </span>
  );
}

