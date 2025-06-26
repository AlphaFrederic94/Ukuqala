import React from 'react';
import IllustrationImage from './IllustrationImage';
import { Button } from './ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * A component for displaying empty states with illustrations
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  illustration = 'empty-state',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-6 w-64 h-64">
        <IllustrationImage name={illustration} alt={title} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
