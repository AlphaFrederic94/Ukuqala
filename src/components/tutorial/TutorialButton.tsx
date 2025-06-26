import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTutorial } from '../../contexts/TutorialContext';
import { useTranslation } from 'react-i18next';

interface TutorialButtonProps {
  tutorialId: string;
  className?: string;
  showIcon?: boolean;
  label?: string;
  variant?: 'primary' | 'secondary' | 'text' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

const TutorialButton: React.FC<TutorialButtonProps> = ({
  tutorialId,
  className = '',
  showIcon = true,
  label,
  variant = 'secondary',
  size = 'md',
}) => {
  const { startTutorial, isTutorialAvailable } = useTutorial();
  const { t } = useTranslation();

  if (!isTutorialAvailable(tutorialId)) {
    return null;
  }

  const handleClick = () => {
    startTutorial(tutorialId);
  };

  // Base classes
  let baseClasses = 'flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 rounded',
    md: 'text-sm px-3 py-2 rounded-md',
    lg: 'text-base px-4 py-2 rounded-md',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200',
    text: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline',
    icon: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1',
  };

  // Combine classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  // Default label
  const defaultLabel = t('common.help');
  const buttonLabel = label || defaultLabel;

  return (
    <button
      onClick={handleClick}
      className={buttonClasses}
      aria-label={buttonLabel}
      title={buttonLabel}
    >
      {showIcon && <HelpCircle className={`${variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4 mr-2'}`} />}
      {variant !== 'icon' && buttonLabel}
    </button>
  );
};

export default TutorialButton;
