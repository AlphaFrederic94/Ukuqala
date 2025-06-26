import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          className={`
            w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200
            dark:border-spotify-lighter-gray dark:bg-spotify-lighter-gray dark:text-spotify-text-white
            dark:placeholder:text-spotify-text-light dark:focus:ring-spotify-green dark:focus:border-spotify-green
            ${error ? 'border-red-500 focus:ring-red-500 dark:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="mt-1 text-xs text-red-500">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
