import { useState, useEffect } from 'react';
import axios from 'axios';
import { BeatLoader } from 'react-spinners';
import { SunIcon, CloudIcon, LocationMarkerIcon } from '@heroicons/react/outline';
import { WeatherData, ForecastData } from './types';

const WeatherApp = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [location, setLocation] = useState('');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const [weatherRes, forecastRes] = await Promise.all([
        axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`),
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`)
      ]);
      setWeather(weatherRes.data);
      setForecast(forecastRes.data);
    } catch (err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    try {
      setLoading(true);
      const geoRes = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`
      );

      if (geoRes.data.length === 0) {
        setError('Location not found');
        return;
      }

      const { lat, lon } = geoRes.data[0];
      await fetchWeather(lat, lon);
    } catch (err) {
      setError('Failed to fetch location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      () => setError('Geolocation blocked. Please enable it or search manually.')
    );
  }, [unit]);

  if (loading) return <BeatLoader className="text-center mt-8" color="#3B82F6" />;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      <form onSubmit={handleSearch} className="flex gap-4 mb-8">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter city name"
          className="flex-1 p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setUnit(unit === 'metric' ? 'imperial' : 'metric')}
          className="bg-gray-200 px-4 rounded-lg hover:bg-gray-300 transition-colors"
        >
          °{unit === 'metric' ? 'C' : 'F'}
        </button>
      </form>

      {weather && forecast && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <LocationMarkerIcon className="w-6 h-6 text-blue-500" />
              <h2 className="text-3xl font-bold">
                {weather.name}, {forecast.city.country}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                  alt="Weather icon"
                  className="w-24 h-24"
                />
                <div>
                  <p className="text-5xl font-bold">
                    {Math.round(weather.main.temp)}°{unit === 'metric' ? 'C' : 'F'}
                  </p>
                  <p className="text-gray-600 capitalize">{weather.weather[0].description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <WeatherDetail
                  icon={<SunIcon className="w-6 h-6" />}
                  label="Feels like"
                  value={`${Math.round(weather.main.feels_like)}°${unit === 'metric' ? 'C' : 'F'}`}
                />
                <WeatherDetail
                  icon={<CloudIcon className="w-6 h-6" />}
                  label="Humidity"
                  value={`${weather.main.humidity}%`}
                />
                <WeatherDetail
                  icon={<svg /* wind icon */ />}
                  label="Wind Speed"
                  value={`${weather.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}`}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">5-Day Forecast</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.list.slice(0, 5).map((day) => (
                <ForecastDay key={day.dt} data={day} unit={unit} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WeatherDetail = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-blue-500">{icon}</span>
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

const ForecastDay = ({ data, unit }: { data: WeatherData; unit: 'metric' | 'imperial' }) => (
  <div className="p-4 bg-gray-50 rounded-lg text-center">
    <p className="font-medium mb-2">
      {new Date(data.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
    </p>
    <img
      src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`}
      alt="Weather icon"
      className="w-12 h-12 mx-auto"
    />
    <p className="text-xl font-bold mt-2">
      {Math.round(data.main.temp)}°{unit === 'metric' ? 'C' : 'F'}
    </p>
    <p className="text-gray-600 text-sm capitalize">{data.weather[0].description}</p>
  </div>
);

export default WeatherApp;