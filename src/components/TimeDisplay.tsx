import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

interface TimeDisplayProps {
  locale: string;
  timezone: string;
}

export default function TimeDisplay({ locale, timezone }: TimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dateLocale = locale === 'fr' ? fr : enUS;
  
  const formattedTime = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: locale === 'en',
  }).format(currentTime);

  const formattedDate = format(currentTime, 'PPPP', {
    locale: dateLocale,
  });

  return (
    <div className="text-center">
      <div className="text-3xl font-bold dark:text-white">{formattedTime}</div>
      <div className="text-gray-600 dark:text-gray-300">{formattedDate}</div>
    </div>
  );
}