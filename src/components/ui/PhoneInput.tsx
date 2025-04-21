'use client';

import { useRef, useState, forwardRef, Ref } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { motion, AnimatePresence } from 'framer-motion';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const CustomPhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  value,
  onChange,
  error,
  helperText,
  className = '',
  disabled = false,
  required = false,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const showLabel = isFocused || value.length > 0;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <motion.label
          initial={false}
          animate={{
            y: showLabel ? -24 : 0,
            scale: showLabel ? 0.85 : 1,
            color: error ? 'rgb(239, 68, 68)' : showLabel ? 'rgb(59, 130, 246)' : 'rgb(107, 114, 128)',
          }}
          className={`absolute left-2 origin-left transition-colors
            ${showLabel ? 'pointer-events-none' : 'cursor-text'}`}
          onClick={() => {
            if (ref && typeof ref === 'object' && ref.current) {
              ref.current.focus();
            }
          }}
        >
          Phone Number {required && '*'}
        </motion.label>
        <PhoneInput
          ref={ref as Ref<HTMLInputElement>}
          inputProps={{
            required,
            name: 'phone',
          }}
          country={'za'}
          value={value}
          onChange={onChange}
          placeholder={!isFocused && !value ? helperText : ''}
          disabled={disabled}
          inputClass={`w-full py-2 px-3 rounded-lg border-2 transition-colors
            ${error ? 'border-red-500 dark:border-red-400' : isFocused ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}
            ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900'}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          containerClass="w-full"
          buttonClass={`
            ${error ? 'border-red-500 dark:border-red-400' : isFocused ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'}
            ${disabled ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          dropdownClass="bg-white dark:bg-gray-900 dark:text-white"
          searchClass="bg-white dark:bg-gray-900 dark:text-white"
        />
      </div>
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
});

CustomPhoneInput.displayName = 'CustomPhoneInput';

export default CustomPhoneInput;