import React, { useState, useEffect } from 'react';
import { useWeather, ForecastDay } from '../lib/weatherService';
import {
  Cloud, CloudRain, Sun, Wind, Droplets, Thermometer, Umbrella,
  CloudLightning, CloudSnow, CloudFog, Loader2, MapPin, AlertCircle,
  ArrowLeft, Search, Sunrise, Sunset, CloudSun, ChevronRight, RefreshCw,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import IllustrationImage from '../components/IllustrationImage';

export default function Weather() {
  const [location, setLocation] = useState<string>('auto:ip');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const { weather, forecast, loading, error, isUsingGeolocation } = useWeather(location);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [locationLocked, setLocationLocked] = useState<boolean>(true);

  useEffect(() => {
    // Check if we have a saved location preference
    const savedLocation = localStorage.getItem('careai_weather_last_location');
    const isUsingGeo = localStorage.getItem('careai_weather_using_geolocation') === 'true';

    if (savedLocation) {
      // Use the saved location if it exists
      setLocation(savedLocation);
      setLocationLocked(isUsingGeo); // Lock if using geolocation
    } else if (navigator.geolocation) {
      // Otherwise try to get the user's location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Format coordinates properly
          setLocation(`${latitude},${longitude}`);
          setLocationLocked(true); // Lock when using geolocation
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to a default location
          setLocation('New York');
          setLocationLocked(false); // Don't lock when using default location
        },
        { timeout: 5000, maximumAge: 60000 } // Options to speed up the process
      );
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Don't allow 'auto:ip' as a search term since OpenWeatherMap doesn't support it
      const query = searchQuery.trim().toLowerCase() === 'auto:ip' ? 'New York' : searchQuery.trim();
      setLocation(query);
      setLocationLocked(false); // Unlock when manually searching
      setSelectedDay(0);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setRefreshing(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude},${longitude}`);
          setLocationLocked(true); // Lock when using geolocation
          setRefreshing(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setRefreshing(false);
          // Show error message
          alert('Could not get your location. Please check your browser permissions.');
        },
        { timeout: 5000, maximumAge: 0 } // Don't use cached position
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Re-fetch by setting the same location (will trigger the useWeather hook)
    const currentLocation = location;
    setLocation('');
    setTimeout(() => {
      setLocation(currentLocation);
      setRefreshing(false);
    }, 100);
  };

  // Get weather condition icon based on code
  const getWeatherIcon = (code: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeMap = {
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-12 w-12'
    };

    const iconSize = sizeMap[size];

    // Weather condition codes mapped from OpenWeatherMap
    if (code === 1000) return <Sun className={`${iconSize} text-yellow-500`} />; // Clear
    if (code === 1003) return <Cloud className={`${iconSize} text-gray-500`} />; // Cloudy
    if (code === 1030) return <CloudFog className={`${iconSize} text-gray-400`} />; // Fog/Mist
    if (code === 1063) return <CloudRain className={`${iconSize} text-blue-500`} />; // Drizzle
    if (code === 1087) return <CloudLightning className={`${iconSize} text-purple-500`} />; // Thunderstorm
    if (code === 1183) return <CloudRain className={`${iconSize} text-blue-500`} />; // Rain
    if (code === 1210) return <CloudSnow className={`${iconSize} text-blue-200`} />; // Snow

    return <Cloud className={`${iconSize} text-gray-500`} />; // Default
  };

  // Format date to day name
  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Format time (convert 24h to 12h)
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-2">Weather Forecast</h1>
          {isUsingGeolocation && (
            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              Using your location
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleUseCurrentLocation}
            disabled={loading || refreshing || (isUsingGeolocation && locationLocked)}
            className={`p-2 rounded-full ${isUsingGeolocation && locationLocked ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30'} transition-colors`}
            aria-label="Use current location"
            title="Use current location"
          >
            <MapPin className="h-5 w-5" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
            aria-label="Refresh weather data"
            title="Refresh weather data"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Search className="h-5 w-5 mr-1" />
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <span className="text-gray-600 dark:text-gray-300">Loading weather data...</span>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <div className="flex items-center text-red-500 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span className="font-medium text-lg">Weather data unavailable</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => setLocation('auto:ip')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : weather && forecast ? (
        <div className="space-y-6">
          {/* Current Weather Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full animate-pulse" style={{ animationDuration: '7s' }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    <h2 className="text-xl font-bold">{weather.location.name}, {weather.location.country}</h2>
                  </div>
                  <p className="text-blue-100 mt-1">
                    {new Date(weather.location.localtime).toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getWeatherIcon(weather.current.condition.code, 'lg')}
                  <div className="ml-4">
                    <div className="text-5xl font-bold">{Math.round(weather.current.temp_c)}°C</div>
                    <div className="text-xl text-blue-100">{weather.current.condition.text}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div className="flex items-center">
                    <Thermometer className="h-5 w-5 mr-2 text-orange-300" />
                    <span>Feels like: {Math.round(weather.current.feelslike_c)}°C</span>
                  </div>
                  <div className="flex items-center">
                    <Wind className="h-5 w-5 mr-2 text-blue-300" />
                    <span>Wind: {Math.round(weather.current.wind_kph)} km/h {weather.current.wind_dir}</span>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="h-5 w-5 mr-2 text-blue-300" />
                    <span>Humidity: {weather.current.humidity}%</span>
                  </div>
                  <div className="flex items-center">
                    <Sun className="h-5 w-5 mr-2 text-yellow-300" />
                    <span>UV Index: {weather.current.uv}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Days Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {forecast.map((day: ForecastDay, index: number) => (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(index)}
                  className={`flex-1 min-w-[120px] py-4 px-4 text-center font-medium transition-colors ${
                    selectedDay === index
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm mb-1">
                      {index === 0 ? 'Today' : formatDay(day.date)}
                    </span>
                    <div className="mb-1">
                      {getWeatherIcon(day.day.condition.code, 'sm')}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{Math.round(day.day.maxtemp_c)}°</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">{Math.round(day.day.mintemp_c)}°</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Day Details */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDay}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedDay === 0 ? 'Today' : formatDay(forecast[selectedDay].date)}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="flex items-center text-blue-700 dark:text-blue-300 mb-1 text-sm font-medium">
                          <Thermometer className="h-4 w-4 mr-1" />
                          Max Temperature
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {Math.round(forecast[selectedDay].day.maxtemp_c)}°C
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="flex items-center text-blue-700 dark:text-blue-300 mb-1 text-sm font-medium">
                          <Thermometer className="h-4 w-4 mr-1" />
                          Min Temperature
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {Math.round(forecast[selectedDay].day.mintemp_c)}°C
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="flex items-center text-blue-700 dark:text-blue-300 mb-1 text-sm font-medium">
                          <Umbrella className="h-4 w-4 mr-1" />
                          Chance of Rain
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {forecast[selectedDay].day.daily_chance_of_rain}%
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="flex items-center text-blue-700 dark:text-blue-300 mb-1 text-sm font-medium">
                          <Sun className="h-4 w-4 mr-1" />
                          UV Index
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {forecast[selectedDay].day.uv}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <Sunrise className="h-5 w-5 text-orange-500 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Sunrise: {formatTime(forecast[selectedDay].astro.sunrise)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Sunset className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Sunset: {formatTime(forecast[selectedDay].astro.sunset)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hourly Forecast */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Hourly Forecast
                    </h3>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex space-x-4 min-w-max">
                        {forecast[selectedDay].hour
                          .filter((_, i) => i % 3 === 0) // Show every 3 hours to save space
                          .map((hour) => {
                            const hourTime = new Date(hour.time);
                            const isCurrentHour = selectedDay === 0 &&
                              new Date().getHours() === hourTime.getHours();

                            return (
                              <div
                                key={hour.time}
                                className={`flex flex-col items-center p-3 rounded-lg min-w-[80px] ${
                                  isCurrentHour
                                    ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500'
                                    : 'bg-gray-50 dark:bg-gray-700'
                                }`}
                              >
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  {hourTime.getHours() === 0 ? '12 AM' :
                                   hourTime.getHours() === 12 ? '12 PM' :
                                   hourTime.getHours() > 12 ? `${hourTime.getHours() - 12} PM` :
                                   `${hourTime.getHours()} AM`}
                                </span>
                                <div className="mb-2">
                                  {getWeatherIcon(hour.condition.code, 'sm')}
                                </div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {Math.round(hour.temp_c)}°C
                                </span>
                                {hour.chance_of_rain > 20 && (
                                  <div className="flex items-center mt-1 text-blue-600 dark:text-blue-400">
                                    <Droplets className="h-3 w-3 mr-1" />
                                    <span className="text-xs">{hour.chance_of_rain}%</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Weather Tips */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <CloudSun className="h-5 w-5 text-blue-500 mr-2" />
                  Weather-Based Health Tips
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Personalized health recommendations based on current weather conditions</p>
              </div>
              <div className="mt-4 md:mt-0">
                <IllustrationImage
                  name="weather"
                  alt="Weather Health Tips"
                  className="h-32"
                />
              </div>
            </div>

            <div className="space-y-4">
              {weather.current.uv > 5 && (
                <div className="flex items-start">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full mr-3 mt-1">
                    <Sun className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">High UV Index</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      UV index is high today. Apply sunscreen, wear protective clothing, and limit direct sun exposure between 10 AM and 4 PM.
                    </p>
                  </div>
                </div>
              )}

              {weather.current.humidity > 80 && (
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3 mt-1">
                    <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">High Humidity</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      High humidity can make it harder for your body to cool down. Stay hydrated and take breaks from physical activity.
                    </p>
                  </div>
                </div>
              )}

              {weather.current.temp_c > 30 && (
                <div className="flex items-start">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full mr-3 mt-1">
                    <Thermometer className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">High Temperature</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Stay hydrated, seek shade, and avoid strenuous outdoor activities during the hottest parts of the day.
                    </p>
                  </div>
                </div>
              )}

              {weather.current.temp_c < 10 && (
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3 mt-1">
                    <Thermometer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Cold Temperature</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Dress in layers, protect extremities, and be aware of signs of hypothermia or frostbite during prolonged exposure.
                    </p>
                  </div>
                </div>
              )}

              {forecast[0].day.daily_chance_of_rain > 50 && (
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3 mt-1">
                    <CloudRain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Rainy Conditions</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      High chance of rain today. Carry an umbrella and wear appropriate footwear to prevent slips and falls.
                    </p>
                  </div>
                </div>
              )}

              {/* Default tip if none of the above apply */}
              {!(weather.current.uv > 5 || weather.current.humidity > 80 ||
                 weather.current.temp_c > 30 || weather.current.temp_c < 10 ||
                 forecast[0].day.daily_chance_of_rain > 50) && (
                <div className="flex items-start">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full mr-3 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Favorable Weather</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Weather conditions are favorable today. It's a good day for outdoor activities and exercise.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Link to="/tips" className="text-blue-600 dark:text-blue-400 flex items-center text-sm font-medium hover:underline">
                View more health tips
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
