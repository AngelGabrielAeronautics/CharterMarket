'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectProps {
  label: string;
  name: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}

export default function Select({
  label,
  name,
  value = '',
  onChange,
  required = false,
  error,
  helperText,
  options = [],
  className = '',
  disabled = false,
}: SelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  const isLabelFloating = isFocused || value?.length > 0;

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
        <select
          ref={selectRef}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`
            w-full px-4 py-3
            bg-transparent
            text-primary-900 dark:text-cream-100
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            appearance-none
          `}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400 dark:text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <AnimatePresence>
          {isLabelFloating && (
            <motion.label
              initial={{ y: 0, scale: 1 }}
              animate={{ y: -24, scale: 0.85 }}
              exit={{ y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              htmlFor={name}
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
    </div>
  );
} 