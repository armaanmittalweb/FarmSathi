import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { MapPin, Droplets, AlertCircle } from "lucide-react";
import { getWeather } from "../api/weather";
import { setLastWeather } from "../store/farmerSlice";
import { iconForWeatherCode } from "../weatherIcons";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Weather() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = (lat, lon) => {
    setLoading(true);
    setError(null);
    getWeather(lat, lon)
      .then((result) => {
        setData(result);
        dispatch(setLastWeather(result));
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to fetch weather."))
      .finally(() => setLoading(false));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLoading(false);
        setError(t("weather.locationDenied"));
      },
    );
  };

  const CurrentIcon = data ? iconForWeatherCode(data.current.weather_code) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="mb-1 text-2xl font-bold text-sand-900">{t("weather.title")}</h1>
      <p className="mb-6 text-sm text-sand-500">{t("weather.subtitle")}</p>

      {!data && (
        <Button onClick={useMyLocation} disabled={loading} size="lg" icon={MapPin}>
          {loading ? t("weather.locating") : t("weather.useLocation")}
        </Button>
      )}

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm font-medium text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {data && (
        <div className="mt-2 space-y-5">
          <Card className="flex items-center justify-between p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-sand-500">{t("weather.current")}</p>
              <p className="mt-1 text-4xl font-bold text-sand-900">{Math.round(data.current.temperature_2m)}°C</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-sand-500">
                <Droplets size={14} className="text-info" /> {data.current.relative_humidity_2m}%
              </p>
            </div>
            <CurrentIcon size={56} strokeWidth={1.5} className="text-clay-500" />
          </Card>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-7">
            {data.daily.time.map((date, i) => {
              const DayIcon = iconForWeatherCode(data.daily.weather_code[i]);
              return (
                <Card key={date} className="flex flex-col items-center gap-1 p-3 text-center">
                  <p className="text-xs font-medium text-sand-600">
                    {new Date(date).toLocaleDateString(undefined, { weekday: "short" })}
                  </p>
                  <DayIcon size={22} strokeWidth={1.75} className="my-1 text-clay-500" />
                  <p className="text-sm font-semibold text-sand-900">{Math.round(data.daily.temperature_2m_max[i])}°</p>
                  <p className="text-xs text-sand-400">{Math.round(data.daily.temperature_2m_min[i])}°</p>
                  <p className="mt-1 flex items-center gap-0.5 text-[0.7rem] text-info">
                    <Droplets size={11} /> {data.daily.precipitation_sum[i]}mm
                  </p>
                </Card>
              );
            })}
          </div>

          <Button onClick={useMyLocation} variant="secondary" size="sm" icon={MapPin}>
            {t("weather.useLocation")}
          </Button>
        </div>
      )}
    </div>
  );
}
