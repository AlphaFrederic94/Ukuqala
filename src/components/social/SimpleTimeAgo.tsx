import React from 'react';

interface SimpleTimeAgoProps {
  date: string | number | Date;
}

const SimpleTimeAgo: React.FC<SimpleTimeAgoProps> = ({ date }) => {
  const formatTimeAgo = (dateInput: string | number | Date): string => {
    const now = new Date();
    const past = new Date(dateInput);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else if (diffMonth < 12) {
      return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
    } else {
      return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
    }
  };
  
  return <span>{formatTimeAgo(date)}</span>;
};

export default SimpleTimeAgo;
