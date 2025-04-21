'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  min?: string;
  max?: string;
}

export default function DateInput({
  label,
  name,
  value,
  onChange,
  required = false,
  error,
  helperText,
  className = '',
  disabled = false,
  id,
  onFocus,
  onBlur,
  min,
  max,
}: DateInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLabelFloating = isFocused || value.length > 0;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          relative flex items-center
          border rounded-lg
          ${error 
            ? 'border-red-500 dark:border-red-400' 
            : isFocused 
              ? 'border-primary-500 dark:border-primary-400' 
              : 'border-gray-300 dark:border-dark-border'
          }
          ${disabled ? 'bg-gray-100 dark:bg-dark-accent' : 'bg-white dark:bg-dark-primary'}
          transition-colors duration-200
        `}
      >
        <input
          ref={inputRef}
          id={id || name}
          name={name}
          type="date"
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          min={min}
          max={max}
          className={`
            w-full px-4 py-3
            bg-transparent
            text-primary-900 dark:text-cream-100
            placeholder-transparent
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            [&::-webkit-calendar-picker-indicator]:opacity-100
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
            [&::-webkit-calendar-picker-indicator]:dark:invert
          `}
          placeholder={label}
        />
        <AnimatePresence>
          {isLabelFloating && (
            <motion.label
              initial={{ y: 0, scale: 1 }}
              animate={{ y: -24, scale: 0.85 }}
              exit={{ y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              htmlFor={id || name}
              className={`
                absolute left-0 px-2
                ${error 
                  ? 'text-red-500 dark:text-red-400' 
                  : isFocused 
                    ? 'text-primary-500 dark:text-primary-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }
                bg-white dark:bg-dark-primary
                pointer-events-none
                origin-left
              `}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </motion.label>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {(error || helperText) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`
              mt-1 text-sm px-2
              ${error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
            `}
          >
            {error || helperText}
          </motion.p>
        )}
      </AnimatePresence>
      {required && !isLabelFloating && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500">*</span>
      )}
    </div>
  );
} 