import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Sprout, AlertCircle, CloudSun } from "lucide-react";
import { analyzeSoil } from "../api/analysis";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const FIELDS = ["n", "p", "k", "temperature", "humidity", "ph", "rainfall"];
const initialForm = { n: "", p: "", k: "", temperature: "", humidity: "", ph: "", rainfall: "" };

export default function SoilAnalysis() {
  const { t } = useTranslation();
  const lastWeather = useSelector((s) => s.farmer.lastWeather);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const prefillFromWeather = () => {
    if (!lastWeather?.current) return;
    setForm((prev) => ({
      ...prev,
      temperature: String(lastWeather.current.temperature_2m ?? prev.temperature),
      humidity: String(lastWeather.current.relative_humidity_2m ?? prev.humidity),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await analyzeSoil({
        n: Number(form.n), p: Number(form.p), k: Number(form.k),
        temperature: Number(form.temperature), humidity: Number(form.humidity),
        ph: Number(form.ph), rainfall: Number(form.rainfall),
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Is ai-service running with a trained model?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <h1 className="mb-1 text-2xl font-bold text-sand-900">{t("soil.title")}</h1>
      <p className="mb-6 text-sm text-sand-500">{t("soil.subtitle")}</p>

      {lastWeather && (
        <button
          onClick={prefillFromWeather}
          type="button"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs font-medium text-sand-600 hover:border-moss-300 hover:text-moss-700"
        >
          <CloudSun size={14} /> {t("soil.prefillFromWeather")}
        </button>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {FIELDS.map((key) => (
          <Input
            key={key}
            label={t(`soil.${key}`)}
            name={key}
            type="number"
            step="any"
            value={form[key]}
            onChange={handleChange}
            required
          />
        ))}

        <Button type="submit" disabled={loading} full size="lg" icon={Sprout} className="col-span-2 mt-1">
          {loading ? t("chat.thinking") : t("soil.submit")}
        </Button>
      </form>

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm font-medium text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {result && (
        <Card className="mt-6 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sand-500">{t("soil.result")}</h2>
          <p className="mt-1 text-2xl font-bold capitalize text-moss-700">{result.crop}</p>

          {result.alternatives?.length > 1 && (
            <div className="mt-4 space-y-2.5 border-t border-sand-100 pt-4">
              <p className="text-xs font-medium text-sand-500">{t("soil.alternatives")}</p>
              {result.alternatives.map((alt) => (
                <div key={alt.crop}>
                  <div className="flex justify-between text-sm text-sand-700">
                    <span className="capitalize">{alt.crop}</span>
                    <span className="text-sand-400">{(alt.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-100">
                    <div className="h-full rounded-full bg-moss-400" style={{ width: `${alt.confidence * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
