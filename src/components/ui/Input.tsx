'use client';

import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    return (
      <div className={`relative w-full ${className}`}>
        <div className="relative">
          {label && (
            <motion.label
              initial={false}
              animate={{
                y: props.value && props.value.toString().length > 0 ? -24 : 0,
                scale: props.value && props.value.toString().length > 0 ? 0.85 : 1,
                color: error ? 'rgb(239, 68, 68)' : props.value && props.value.toString().length > 0 ? 'rgb(59, 130, 246)' : 'rgb(107, 114, 128)',
              }}
              className={`absolute left-2 origin-left transition-colors
                ${props.value && props.value.toString().length > 0 ? 'pointer-events-none' : 'cursor-text'}`}
            >
              {label}
            </motion.label>
          )}
          <input
            type={type}
            className={cn(
              'w-full py-2 px-3 rounded-lg border-2 transition-colors',
              error ? 'border-red-500 dark:border-red-400' : props.value && props.value.toString().length > 0 ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600',
              props.disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900',
              className
            )}
            ref={ref}
            {...props}
            placeholder={!props.value ? helperText : ''}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-1 text-sm px-2 text-red-500 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 