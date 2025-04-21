import { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

interface BannerProps {
  variant?: BannerVariant;
  children: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<BannerVariant, string> = {
  info: 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200',
  success: 'bg-green-50 border-green-400 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-700 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-200',
  error: 'bg-red-50 border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200'
};

export default function Banner({ 
  variant = 'info',
  children, 
  action,
  onDismiss,
  className 
}: BannerProps) {
  return (
    <div className={cn(
      'border-l-4 p-4 mb-4',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-sm sm:text-base">
          {children}
        </div>
        <div className="flex items-center space-x-4">
          {action && (
            <button
              onClick={action.onClick}
              disabled={action.loading}
              className={cn(
                'text-sm font-medium whitespace-nowrap',
                'hover:opacity-80 disabled:opacity-50',
                variant === 'info' && 'text-blue-600 dark:text-blue-400',
                variant === 'success' && 'text-green-600 dark:text-green-400',
                variant === 'warning' && 'text-yellow-600 dark:text-yellow-400',
                variant === 'error' && 'text-red-600 dark:text-red-400'
              )}
            >
              {action.loading ? 'LOADING...' : action.label}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-current opacity-60 hover:opacity-100"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 