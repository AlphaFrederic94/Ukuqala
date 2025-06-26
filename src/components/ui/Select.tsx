import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options?: SelectOption[];  // Make options optional
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', options = [], ...props }, ref) => {  // Provide default empty array
    return (
      <select
        ref={ref}
        className={`
          w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select; // Add default export
