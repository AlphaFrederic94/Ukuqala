import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-spotify-green dark:text-spotify-black dark:hover:bg-spotify-green-hover dark:hover:scale-105 transition-all duration-200',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-spotify-lighter-gray dark:hover:bg-spotify-light-gray dark:text-spotify-text-white',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-spotify-light-gray dark:text-spotify-text-light',
      link: 'bg-transparent underline-offset-4 hover:underline text-blue-600 dark:text-spotify-green'
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
