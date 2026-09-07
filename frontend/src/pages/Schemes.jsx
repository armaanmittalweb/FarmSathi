import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, ShieldCheck, CreditCard, ClipboardList, Droplets, Store, ExternalLink, AlertCircle } from "lucide-react";
import { getSchemes } from "../api/schemes";
import Card from "../components/ui/Card";

const CATEGORY_ICONS = {
  income_support: Wallet,
  insurance: ShieldCheck,
  credit: CreditCard,
  advisory: ClipboardList,
  irrigation: Droplets,
  market_access: Store,
};

export default function Schemes() {
  const { t, i18n } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSchemes(i18n.language)
      .then(setSchemes)
      .catch((err) => setError(err.response?.data?.error || "Failed to load schemes."))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="mb-1 text-2xl font-bold text-sand-900">{t("schemes.title")}</h1>
      <p className="mb-6 text-sm text-sand-500">{t("schemes.subtitle")}</p>

      {error && (
        <p className="flex items-start gap-2 text-sm font-medium text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-sand-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {schemes.map((scheme) => {
            const Icon = CATEGORY_ICONS[scheme.category] || ClipboardList;
            return (
              <Card key={scheme.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-moss-50 text-moss-600">
                    <Icon size={18} strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-sand-900">{scheme.name}</h2>
                    <p className="mt-1 text-sm text-sand-600">{scheme.summary}</p>

                    <dl className="mt-3 space-y-1.5 border-t border-sand-100 pt-3 text-xs">
                      <div className="flex gap-1.5">
                        <dt className="shrink-0 font-medium text-sand-500">{t("schemes.eligibility")}:</dt>
                        <dd className="text-sand-600">{scheme.eligibility}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="shrink-0 font-medium text-sand-500">{t("schemes.howToApply")}:</dt>
                        <dd className="text-sand-600">{scheme.how_to_apply}</dd>
                      </div>
                    </dl>

                    <a
                      href={scheme.official_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-moss-700 hover:text-moss-800 hover:underline"
                    >
                      {t("schemes.officialLink")} <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
