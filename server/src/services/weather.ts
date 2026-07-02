import axios from "axios";

type WeatherUnits = "imperial" | "metric";

export type ConditionName =
  | "Thunderstorm"
  | "Drizzle"
  | "Rain"
  | "Snow"
  | "Mist"
  | "Smoke"
  | "Haze"
  | "Dust"
  | "Fog"
  | "Sand"
  | "Ash"
  | "Squall"
  | "Tornado"
  | "Clear"
  | "Clouds";

export interface WeatherReport {
  low: number;
  high: number;
  probOfPercip: number;
  sunrise: Date;
  sunset: Date;
  currentTemp: number;
  currentHumidity: number;
  currentUvi: number;
  currentWindSpeed: number;
  currentConditions: ConditionName;
}

/**
 * Provider-agnostic weather.
 *
 * OpenWeather's One Call API 3.0 requires a paid subscription, so weather now
 * defaults to keyless Open-Meteo. Set WEATHER_PROVIDER to:
 *   - "open-meteo"  : keyless, no account required (default)
 *   - "openweather" : legacy One Call 3.0 (needs OPEN_WEATHER_KEY)
 * If unset, OpenWeather is used only when OPEN_WEATHER_KEY is present.
 */

type WeatherProvider = "open-meteo" | "openweather";

const env = (name: string) => {
  const v = process.env[name];
  return v && v !== "XXX" ? v : undefined;
};

const resolveProvider = (): WeatherProvider => {
  const explicit = process.env.WEATHER_PROVIDER?.toLowerCase();
  if (explicit === "open-meteo" || explicit === "openweather") return explicit;
  return env("OPEN_WEATHER_KEY") ? "openweather" : "open-meteo";
};

// --- OpenWeather (legacy) ---

interface OwmConditions {
  id: number;
  main: ConditionName;
}
interface OwmCurrent {
  temp: number;
  humidity: number;
  uvi: number;
  wind_speed: number;
  weather: OwmConditions[];
}
interface OwmDaily {
  sunrise: number;
  sunset: number;
  temp: { min: number; max: number };
  pop: number;
}
interface OwmResponse {
  current: OwmCurrent;
  daily: OwmDaily[];
}

const getOpenWeather = async (
  lat: number,
  lng: number,
  units: WeatherUnits
): Promise<WeatherReport> => {
  const client = axios.create({
    baseURL: "https://api.openweathermap.org/data/3.0",
    params: { appid: env("OPEN_WEATHER_KEY") as string },
  });

  const res = await client.get("/onecall", {
    params: { lat, lon: lng, units, exclude: "minutely,hourly,alerts" },
  });

  const { current, daily } = res.data as OwmResponse;

  return {
    low: daily[0].temp.min,
    high: daily[0].temp.max,
    probOfPercip: daily[0].pop,
    sunrise: new Date(daily[0].sunrise * 1000),
    sunset: new Date(daily[0].sunset * 1000),
    currentTemp: current.temp,
    currentHumidity: current.humidity,
    currentUvi: current.uvi,
    currentWindSpeed: current.wind_speed,
    currentConditions: current.weather[0]?.main ?? "Clear",
  };
};

// --- Open-Meteo (keyless, default) ---

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    uv_index: number;
    weather_code: number;
  };
  daily: {
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}

// Map WMO weather codes to the OpenWeather-style condition names the app already knows.
const wmoToCondition = (code: number): ConditionName => {
  if (code === 0) return "Clear";
  if (code <= 3) return "Clouds";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain";
  if (code === 85 || code === 86) return "Snow";
  if (code >= 95) return "Thunderstorm";
  return "Clouds";
};

const getOpenMeteo = async (
  lat: number,
  lng: number,
  units: WeatherUnits
): Promise<WeatherReport> => {
  const client = axios.create({ baseURL: "https://api.open-meteo.com/v1" });

  const res = await client.get("/forecast", {
    params: {
      latitude: lat,
      longitude: lng,
      current:
        "temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,weather_code",
      daily:
        "temperature_2m_min,temperature_2m_max,precipitation_probability_max,sunrise,sunset",
      temperature_unit: units === "metric" ? "celsius" : "fahrenheit",
      wind_speed_unit: units === "metric" ? "kmh" : "mph",
      timezone: "UTC",
      forecast_days: 1,
    },
  });

  const { current, daily } = res.data as OpenMeteoResponse;

  return {
    low: daily.temperature_2m_min[0],
    high: daily.temperature_2m_max[0],
    // Open-Meteo reports probability as 0-100; the app expects a 0-1 fraction.
    probOfPercip: (daily.precipitation_probability_max[0] ?? 0) / 100,
    sunrise: new Date(daily.sunrise[0]),
    sunset: new Date(daily.sunset[0]),
    currentTemp: current.temperature_2m,
    currentHumidity: current.relative_humidity_2m,
    currentUvi: current.uv_index,
    currentWindSpeed: current.wind_speed_10m,
    currentConditions: wmoToCondition(current.weather_code),
  };
};

export const getWeather = async (
  lat: number,
  lng: number,
  units?: WeatherUnits
): Promise<WeatherReport> => {
  const resolvedUnits = units || "imperial";
  return resolveProvider() === "openweather"
    ? getOpenWeather(lat, lng, resolvedUnits)
    : getOpenMeteo(lat, lng, resolvedUnits);
};
