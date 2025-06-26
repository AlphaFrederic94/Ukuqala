import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  children?: React.ReactNode;
  icon?: boolean;
  delay?: number;
  maxWidth?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
  icon = true,
  delay = 300,
  maxWidth = 250
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Handle showing/hiding the tooltip with delay
  useEffect(() => {
    if (isHovered || isFocused) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered, isFocused, delay]);

  // Handle clicking outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
        setIsHovered(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)' };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%) translateX(8px)' };
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%) translateY(8px)' };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-8px)' };
      default:
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)' };
    }
  };

  // Animation variants
  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      ...getPositionStyles(),
    },
    visible: {
      opacity: 1,
      scale: 1,
      ...getPositionStyles(),
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <div 
      className="relative inline-flex items-center"
      ref={tooltipRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {children || (
        icon && (
          <button 
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none transition-colors"
            aria-label="Help"
            tabIndex={0}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )
      )}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg pointer-events-none"
            style={{ maxWidth }}
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {content}
            {/* Arrow */}
            <div 
              className={`absolute w-2 h-2 bg-gray-800 dark:bg-gray-900 transform rotate-45 ${
                position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
                position === 'right' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                'right-0 top-1/2 -translate-y-1/2 translate-x-1/2'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
