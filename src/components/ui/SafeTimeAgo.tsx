import React from 'react';
import TimeAgo from 'react-timeago';

interface SafeTimeAgoProps {
  date: Date | string | number;
  formatter?: (value: number, unit: string, suffix: string) => string;
  live?: boolean;
  minPeriod?: number;
  maxPeriod?: number;
  title?: string;
  className?: string;
}

/**
 * A safe wrapper around the TimeAgo component to prevent React hook errors
 */
const SafeTimeAgo: React.FC<SafeTimeAgoProps> = (props) => {
  // Use a simple fallback if the component fails
  try {
    return (
      <span className={props.className || ''}>
        <TimeAgo {...props} />
      </span>
    );
  } catch (error) {
    console.warn('TimeAgo component failed, using fallback:', error);
    
    // Simple fallback: format the date as a string
    const formatDate = (date: Date | string | number) => {
      const d = new Date(date);
      return d.toLocaleString();
    };
    
    return (
      <span className={props.className || ''} title={props.title}>
        {formatDate(props.date)}
      </span>
    );
  }
};

export default SafeTimeAgo;
