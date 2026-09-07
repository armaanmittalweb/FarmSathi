import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, ScanSearch, AlertCircle } from "lucide-react";
import { analyzePlant } from "../api/analysis";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function CropAnalysis() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const acceptFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzePlant(file);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Is ai-service running with a trained model?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <h1 className="mb-1 text-2xl font-bold text-sand-900">{t("crop.title")}</h1>
      <p className="mb-6 text-sm text-sand-500">{t("crop.subtitle")}</p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          acceptFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragActive ? "border-moss-500 bg-moss-50" : "border-sand-300 bg-white hover:border-moss-300 hover:bg-moss-50/50"
        }`}
      >
        <input type="file" accept="image/*" onChange={(e) => acceptFile(e.target.files?.[0])} className="hidden" />
        {preview ? (
          <img src={preview} alt="Leaf preview" className="max-h-64 rounded-xl object-contain" />
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss-100 text-moss-600">
              <ImagePlus size={22} />
            </span>
            <p className="text-sand-600">{t("crop.upload")}</p>
          </>
        )}
      </label>

      <Button onClick={handleAnalyze} disabled={!file || loading} full size="lg" icon={ScanSearch} className="mt-4">
        {loading ? t("chat.thinking") : t("crop.analyze")}
      </Button>

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm font-medium text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {result && (
        <Card className="mt-6 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sand-500">{t("crop.result")}</h2>
          <p className="mt-1 text-xl font-bold capitalize text-sand-900">{result.disease?.replace(/_/g, " ")}</p>

          <div className="mt-3">
            <div className="flex justify-between text-xs text-sand-500">
              <span>{t("crop.confidence")}</span>
              <span>{(result.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand-100">
              <div className="h-full rounded-full bg-moss-500" style={{ width: `${result.confidence * 100}%` }} />
            </div>
          </div>

          <p className="mt-4 border-t border-sand-100 pt-4 text-sand-700">{result.recommendation}</p>
        </Card>
      )}
    </div>
  );
}
