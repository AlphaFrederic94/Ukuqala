import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from '../ui/Tooltip';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  required?: boolean;
  validationRules?: ValidationRule[];
  helpText?: string;
  className?: string;
  iconColor?: string;
  autoComplete?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  icon,
  disabled = false,
  type = 'text',
  placeholder = '',
  required = false,
  validationRules = [],
  helpText,
  className = '',
  iconColor = 'text-gray-400',
  autoComplete
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);

  // Validate the field when value changes and it's dirty
  useEffect(() => {
    if (isDirty) {
      validateField(value);
    }
  }, [value, isDirty]);

  // Validate the field
  const validateField = (fieldValue: string) => {
    const fieldErrors: string[] = [];
    
    // Check required
    if (required && !fieldValue.trim()) {
      fieldErrors.push(`${label} is required`);
    }
    
    // Check validation rules
    validationRules.forEach(rule => {
      if (!rule.test(fieldValue)) {
        fieldErrors.push(rule.message);
      }
    });
    
    setErrors(fieldErrors);
    setIsValid(fieldErrors.length === 0);
    
    return fieldErrors.length === 0;
  };

  // Handle blur event
  const handleBlur = () => {
    setIsFocused(false);
    setIsDirty(true);
    validateField(value);
  };

  // Handle focus event
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle change event
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (!isDirty) {
      setIsDirty(true);
    }
  };

  return (
    <div className={`group ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="mt-1">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
            ${isFocused 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 scale-110' 
              : `${iconColor.replace('text-', 'bg-').replace('400', '100')} dark:bg-opacity-30 ${iconColor}`}
          `}>
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {helpText && (
              <Tooltip content={helpText} position="top" />
            )}
          </div>
          
          <div className="relative">
            <input
              type={type}
              value={value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              placeholder={placeholder}
              autoComplete={autoComplete}
              className={`
                w-full px-4 py-2.5 rounded-lg border transition-all duration-300 form-input-focus
                ${disabled ? 'bg-gray-100 dark:bg-gray-800 opacity-70' : 'bg-white dark:bg-gray-700'}
                ${isFocused 
                  ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20' 
                  : 'border-gray-300 dark:border-gray-600'}
                ${!isValid && isDirty ? 'border-red-500 dark:border-red-400' : ''}
                ${isValid && isDirty && value ? 'border-green-500 dark:border-green-400' : ''}
              `}
            />
            
            {/* Validation icon */}
            <AnimatePresence>
              {isDirty && value && (
                <motion.div 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Error messages */}
          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div
                className="mt-1.5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {errors.map((error, index) => (
                  <p key={index} className="text-xs text-red-500 dark:text-red-400">
                    {error}
                  </p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FormField;
