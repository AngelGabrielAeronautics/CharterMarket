'use client';

import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  ({ label, value, onChange, error, disabled, className }, ref) => {
    return (
      <div ref={ref} className={cn('relative w-full', className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-full justify-start text-left font-normal',
                !value && 'text-muted-foreground',
                error && 'border-red-500'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={onChange}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {error && (
          <span className="text-sm text-red-500 mt-1">{error}</span>
        )}
        <label className="absolute -top-2 left-2 -mt-px px-1 text-xs font-medium text-gray-600 bg-white">
          {label}
        </label>
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker'; 