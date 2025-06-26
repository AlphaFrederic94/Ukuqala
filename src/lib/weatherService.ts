import { useState, useEffect } from 'react';

// Using OpenWeatherMap API which has a more generous free tier
const API_KEY = '4d8fb5b93d4af21d66a2948710284366'; // OpenWeatherMap free API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Types for OpenWeatherMap API data
export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_kph: number;
    wind_dir: string;
    humidity: number;
    feelslike_c: number;
    feelslike_f: number;
    uv: number;
  };
  forecast?: {
    forecastday: ForecastDay[];
  };
}

export interface ForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    maxtemp_f: number;
    mintemp_c: number;
    mintemp_f: number;
    avgtemp_c: number;
    avgtemp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    daily_chance_of_rain: number;
    uv: number;
  };
  astro: {
    sunrise: string;
    sunset: string;
  };
  hour: {
    time: string;
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    chance_of_rain: number;
  }[];
}

// OpenWeatherMap API response types
interface OpenWeatherCurrentResponse {
  coord: { lon: number; lat: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: { speed: number; deg: number };
  sys: { country: string; sunrise: number; sunset: number };
  name: string;
  dt: number;
}

interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{ id: number; main: string; description: string; icon: string }>;
    clouds: { all: number };
    wind: { speed: number; deg: number };
    pop: number; // Probability of precipitation
    dt_txt: string;
  }>;
  city: {
    name: string;
    country: string;
    sunrise: number;
    sunset: number;
    coord: { lat: number; lon: number };
  };
}

// Helper function to convert Kelvin to Celsius
const kelvinToCelsius = (kelvin: number): number => {
  return kelvin - 273.15;
};

// Helper function to get wind direction from degrees
const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Helper function to get weather condition code from OpenWeatherMap ID
const getConditionCode = (id: number): number => {
  // Map OpenWeatherMap condition IDs to our custom codes
  if (id >= 200 && id < 300) return 1087; // Thunderstorm
  if (id >= 300 && id < 400) return 1063; // Drizzle
  if (id >= 500 && id < 600) return 1183; // Rain
  if (id >= 600 && id < 700) return 1210; // Snow
  if (id >= 700 && id < 800) return 1030; // Atmosphere (fog, mist, etc.)
  if (id === 800) return 1000; // Clear
  if (id > 800) return 1003; // Clouds
  return 1000; // Default
};

// Weather service functions
export const weatherService = {
  // Get current weather for a location
  async getCurrentWeather(location: string): Promise<WeatherData> {
    try {
      // Check if location is coordinates (lat,lon format)
      const isCoordinates = /^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/.test(location);

      let url = '';
      if (isCoordinates) {
        const [lat, lon] = location.split(',');
        url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
      } else {
        url = `${BASE_URL}/weather?q=${encodeURIComponent(location)}&appid=${API_KEY}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: OpenWeatherCurrentResponse = await response.json();

      // Transform OpenWeatherMap data to our format
      return {
        location: {
          name: data.name,
          region: '',
          country: data.sys.country,
          lat: data.coord.lat,
          lon: data.coord.lon,
          localtime: new Date(data.dt * 1000).toISOString(),
        },
        current: {
          temp_c: Math.round(kelvinToCelsius(data.main.temp) * 10) / 10,
          temp_f: Math.round((kelvinToCelsius(data.main.temp) * 9/5 + 32) * 10) / 10,
          condition: {
            text: data.weather[0].description,
            icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
            code: getConditionCode(data.weather[0].id),
          },
          wind_kph: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          wind_dir: getWindDirection(data.wind.deg),
          humidity: data.main.humidity,
          feelslike_c: Math.round(kelvinToCelsius(data.main.feels_like) * 10) / 10,
          feelslike_f: Math.round((kelvinToCelsius(data.main.feels_like) * 9/5 + 32) * 10) / 10,
          uv: 0, // OpenWeatherMap free tier doesn't provide UV index
        },
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  },

  // Get weather forecast for a location (days: 1-5)
  async getForecast(location: string, days: number = 3): Promise<WeatherData> {
    try {
      // Check if location is coordinates (lat,lon format)
      const isCoordinates = /^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/.test(location);

      let currentWeatherUrl = '';
      let forecastUrl = '';

      if (isCoordinates) {
        const [lat, lon] = location.split(',');
        currentWeatherUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
      } else {
        currentWeatherUrl = `${BASE_URL}/weather?q=${encodeURIComponent(location)}&appid=${API_KEY}`;
        forecastUrl = `${BASE_URL}/forecast?q=${encodeURIComponent(location)}&appid=${API_KEY}`;
      }

      // First get current weather
      const currentWeatherResponse = await fetch(currentWeatherUrl);

      if (!currentWeatherResponse.ok) {
        throw new Error(`Weather API error: ${currentWeatherResponse.status}`);
      }

      const currentData: OpenWeatherCurrentResponse = await currentWeatherResponse.json();

      // Then get forecast
      const forecastResponse = await fetch(forecastUrl);

      if (!forecastResponse.ok) {
        throw new Error(`Weather API error: ${forecastResponse.status}`);
      }

      const forecastData: OpenWeatherForecastResponse = await forecastResponse.json();

      // Process forecast data into days
      const processedForecast: ForecastDay[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Group forecast by day
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Filter forecast items for this day
        const dayForecasts = forecastData.list.filter(item => {
          const itemDate = new Date(item.dt * 1000).toISOString().split('T')[0];
          return itemDate === dateStr;
        });

        if (dayForecasts.length > 0) {
          // Calculate min and max temperatures
          const temps = dayForecasts.map(item => kelvinToCelsius(item.main.temp));
          const minTemp = Math.min(...temps);
          const maxTemp = Math.max(...temps);
          const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;

          // Get the most common weather condition for the day
          const weatherCounts: Record<number, number> = {};
          dayForecasts.forEach(item => {
            const id = item.weather[0].id;
            weatherCounts[id] = (weatherCounts[id] || 0) + 1;
          });

          let mostCommonWeatherId = dayForecasts[0].weather[0].id;
          let maxCount = 0;

          Object.entries(weatherCounts).forEach(([id, count]) => {
            if (count > maxCount) {
              mostCommonWeatherId = parseInt(id);
              maxCount = count;
            }
          });

          // Find a forecast item with this weather ID
          const representativeForecast = dayForecasts.find(item => item.weather[0].id === mostCommonWeatherId) || dayForecasts[0];

          // Calculate chance of rain (average probability of precipitation)
          const rainChance = Math.round(dayForecasts.reduce((sum, item) => sum + (item.pop || 0), 0) / dayForecasts.length * 100);

          // Create hourly forecasts
          const hourlyForecasts = dayForecasts.map(item => ({
            time: new Date(item.dt * 1000).toISOString(),
            temp_c: Math.round(kelvinToCelsius(item.main.temp) * 10) / 10,
            temp_f: Math.round((kelvinToCelsius(item.main.temp) * 9/5 + 32) * 10) / 10,
            condition: {
              text: item.weather[0].description,
              icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
              code: getConditionCode(item.weather[0].id),
            },
            chance_of_rain: Math.round((item.pop || 0) * 100),
          }));

          // Add day to processed forecast
          processedForecast.push({
            date: dateStr,
            day: {
              maxtemp_c: Math.round(maxTemp * 10) / 10,
              maxtemp_f: Math.round((maxTemp * 9/5 + 32) * 10) / 10,
              mintemp_c: Math.round(minTemp * 10) / 10,
              mintemp_f: Math.round((minTemp * 9/5 + 32) * 10) / 10,
              avgtemp_c: Math.round(avgTemp * 10) / 10,
              avgtemp_f: Math.round((avgTemp * 9/5 + 32) * 10) / 10,
              condition: {
                text: representativeForecast.weather[0].description,
                icon: `https://openweathermap.org/img/wn/${representativeForecast.weather[0].icon}@2x.png`,
                code: getConditionCode(representativeForecast.weather[0].id),
              },
              daily_chance_of_rain: rainChance,
              uv: 0, // OpenWeatherMap free tier doesn't provide UV index
            },
            astro: {
              sunrise: new Date(forecastData.city.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              sunset: new Date(forecastData.city.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            },
            hour: hourlyForecasts,
          });
        }
      }

      // Return combined data
      return {
        location: {
          name: currentData.name,
          region: '',
          country: currentData.sys.country,
          lat: currentData.coord.lat,
          lon: currentData.coord.lon,
          localtime: new Date(currentData.dt * 1000).toISOString(),
        },
        current: {
          temp_c: Math.round(kelvinToCelsius(currentData.main.temp) * 10) / 10,
          temp_f: Math.round((kelvinToCelsius(currentData.main.temp) * 9/5 + 32) * 10) / 10,
          condition: {
            text: currentData.weather[0].description,
            icon: `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`,
            code: getConditionCode(currentData.weather[0].id),
          },
          wind_kph: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
          wind_dir: getWindDirection(currentData.wind.deg),
          humidity: currentData.main.humidity,
          feelslike_c: Math.round(kelvinToCelsius(currentData.main.feels_like) * 10) / 10,
          feelslike_f: Math.round((kelvinToCelsius(currentData.main.feels_like) * 9/5 + 32) * 10) / 10,
          uv: 0, // OpenWeatherMap free tier doesn't provide UV index
        },
        forecast: {
          forecastday: processedForecast,
        },
      };
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  }
};

// Local storage keys
const STORAGE_KEYS = {
  LAST_LOCATION: 'careai_weather_last_location',
  IS_USING_GEOLOCATION: 'careai_weather_using_geolocation'
};

// Custom hook for weather data
export function useWeather(location: string, persistLocation: boolean = true) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingGeolocation, setIsUsingGeolocation] = useState<boolean>(
    localStorage.getItem(STORAGE_KEYS.IS_USING_GEOLOCATION) === 'true'
  );

  // Get the actual query location to use
  const getQueryLocation = (inputLocation: string): string => {
    // For auto:ip, check if we have a saved location
    if (inputLocation === 'auto:ip') {
      const savedLocation = localStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
      if (savedLocation) {
        return savedLocation;
      }
      return 'New York'; // Default fallback
    }

    // If location is in the format of coordinates, make sure it's properly formatted
    if (inputLocation.includes(',')) {
      // Try to parse as coordinates
      try {
        const parts = inputLocation.split(',').map(part => part.trim());
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lon = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lon)) {
            setIsUsingGeolocation(true);
            if (persistLocation) {
              localStorage.setItem(STORAGE_KEYS.IS_USING_GEOLOCATION, 'true');
            }
            return `${lat},${lon}`;
          }
        }
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }

    // For regular city names
    setIsUsingGeolocation(false);
    if (persistLocation) {
      localStorage.setItem(STORAGE_KEYS.IS_USING_GEOLOCATION, 'false');
    }
    return inputLocation;
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!location) return;

      try {
        setLoading(true);
        setError(null);

        const queryLocation = getQueryLocation(location);

        // Save the location for future use if needed
        if (persistLocation && queryLocation !== 'auto:ip') {
          localStorage.setItem(STORAGE_KEYS.LAST_LOCATION, queryLocation);
        }

        const forecastData = await weatherService.getForecast(queryLocation);
        setWeather(forecastData);
        setForecast(forecastData.forecast?.forecastday || null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      fetchWeatherData();
    }
  }, [location, persistLocation]);

  return { weather, forecast, loading, error, isUsingGeolocation };
}
