import { PriorityColor } from '@/types/database';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: PriorityColor;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const styles = {
    Red: 'bg-red-100 text-red-800 border-red-300',
    Orange: 'bg-orange-100 text-orange-800 border-orange-300',
    Green: 'bg-green-100 text-green-800 border-green-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles[priority],
        className
      )}
    >
      {priority}
    </span>
  );
}

