import React, { useState, useEffect } from 'react';
import { useWeather, ForecastDay } from '../../lib/weatherService';
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, Umbrella, CloudLightning, CloudSnow, CloudFog, Loader2, MapPin, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WeatherWidgetProps {
  defaultLocation?: string;
  compact?: boolean;
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  defaultLocation = 'auto:ip',
  compact = false,
  className = ''
}) => {
  const [location, setLocation] = useState<string>(defaultLocation);
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const { weather, forecast, loading, error, isUsingGeolocation } = useWeather(location);
  const [locationName, setLocationName] = useState<string>('');

  useEffect(() => {
    // Try to get user's location if defaultLocation is auto:ip
    if (defaultLocation === 'auto:ip' && navigator.geolocation) {
      // Check if we already have a saved location
      const savedLocation = localStorage.getItem('careai_weather_last_location');
      const isUsingGeo = localStorage.getItem('careai_weather_using_geolocation') === 'true';

      if (savedLocation && isUsingGeo) {
        // Use the saved location if it exists and was from geolocation
        setLocation(savedLocation);
      } else {
        // Otherwise try to get a new location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            // Format coordinates properly
            setLocation(`${latitude},${longitude}`);
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Fallback to a default location
            setLocation('New York');
            setLocationName('New York');
          },
          { timeout: 5000, maximumAge: 60000 } // Options to speed up the process
        );
      }
    } else if (defaultLocation !== 'auto:ip') {
      setLocation(defaultLocation);
      setLocationName(defaultLocation);
    }
  }, [defaultLocation]);

  // Get weather condition icon based on code
  const getWeatherIcon = (code: number, isDay: boolean = true) => {
    // Weather condition codes mapped from OpenWeatherMap
    if (code === 1000) return <Sun className="h-8 w-8 text-yellow-500" />; // Clear
    if (code === 1003) return <Cloud className="h-8 w-8 text-gray-500" />; // Cloudy
    if (code === 1030) return <CloudFog className="h-8 w-8 text-gray-400" />; // Fog/Mist
    if (code === 1063) return <CloudRain className="h-8 w-8 text-blue-500" />; // Drizzle
    if (code === 1087) return <CloudLightning className="h-8 w-8 text-purple-500" />; // Thunderstorm
    if (code === 1183) return <CloudRain className="h-8 w-8 text-blue-500" />; // Rain
    if (code === 1210) return <CloudSnow className="h-8 w-8 text-blue-200" />; // Snow

    return <Cloud className="h-8 w-8 text-gray-500" />; // Default
  };

  // Format date to day name
  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex items-center justify-center ${className}`}>
        <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
        <span className="text-gray-600 dark:text-gray-300">Loading weather...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${className}`}>
        <div className="flex items-center text-red-500 mb-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">Weather data unavailable</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  // Compact view for small spaces
  if (compact) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm ${className}`}>
        <div className="flex items-center">
          {getWeatherIcon(weather.current.condition.code)}
          <div className="ml-3">
            <div className="font-medium dark:text-white">{Math.round(weather.current.temp_c)}°C</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              {weather.location.name}
              {isUsingGeolocation && (
                <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded-full flex items-center text-[10px]">
                  <MapPin className="h-2 w-2 mr-0.5" />
                  Current
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Current Weather */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-1">
              <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
              <h3 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                {weather.location.name}, {weather.location.country}
                {isUsingGeolocation && (
                  <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded-full flex items-center">
                    <MapPin className="h-3 w-3 mr-0.5" />
                    Current
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(weather.location.localtime).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={() => setShowForecast(!showForecast)}
            className="text-blue-600 dark:text-blue-400 text-sm flex items-center"
          >
            {showForecast ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide forecast
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show forecast
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            {getWeatherIcon(weather.current.condition.code)}
            <div className="ml-3">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(weather.current.temp_c)}°C
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {weather.current.condition.text}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <Thermometer className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Feels: {Math.round(weather.current.feelslike_c)}°C
              </span>
            </div>
            <div className="flex items-center">
              <Wind className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {Math.round(weather.current.wind_kph)} km/h
              </span>
            </div>
            <div className="flex items-center">
              <Droplets className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {weather.current.humidity}%
              </span>
            </div>
            <div className="flex items-center">
              <Sun className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                UV: {weather.current.uv}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <AnimatePresence>
        {showForecast && forecast && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-700">
              {forecast.map((day: ForecastDay) => (
                <div key={day.date} className="text-center">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    {formatDay(day.date)}
                  </div>
                  <div className="flex justify-center mb-1">
                    {getWeatherIcon(day.day.condition.code, true)}
                  </div>
                  <div className="flex justify-center items-center space-x-1">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {Math.round(day.day.maxtemp_c)}°
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(day.day.mintemp_c)}°
                    </span>
                  </div>
                  {day.day.daily_chance_of_rain > 20 && (
                    <div className="flex justify-center items-center mt-1">
                      <Umbrella className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {day.day.daily_chance_of_rain}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeatherWidget;
