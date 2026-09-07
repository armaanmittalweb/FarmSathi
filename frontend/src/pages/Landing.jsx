import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mic, Camera, FlaskConical, CloudSun, Landmark, ArrowRight } from "lucide-react";
import FarmIllustration from "../components/FarmIllustration";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const FEATURES = [
  { key: "f1", icon: Mic, tint: "bg-moss-50 text-moss-600" },
  { key: "f2", icon: Camera, tint: "bg-clay-50 text-clay-500" },
  { key: "f3", icon: FlaskConical, tint: "bg-moss-50 text-moss-600" },
  { key: "f4", icon: CloudSun, tint: "bg-clay-50 text-clay-500" },
  { key: "f5", icon: Landmark, tint: "bg-moss-50 text-moss-600" },
];

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="inline-block rounded-full bg-moss-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moss-700">
            {t("landing.eyebrow")}
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-sand-900 sm:text-5xl">
            {t("landing.headline")}
          </h1>

          <p className="mt-4 max-w-md text-lg text-sand-600">{t("tagline")}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button as={Link} to="/register" size="lg" icon={ArrowRight} className="flex-row-reverse">
              {t("landing.cta")}
            </Button>
            <Button as={Link} to="/chat" variant="secondary" size="lg">
              {t("landing.ctaSecondary")}
            </Button>
          </div>
        </div>

        <FarmIllustration className="mx-auto w-full max-w-sm text-moss-700 lg:max-w-none" />
      </div>

      <h2 className="mt-20 text-center text-2xl font-bold text-sand-900 sm:mt-28">{t("landing.featuresTitle")}</h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ key, icon: Icon, tint }) => (
          <Card key={key} className="flex items-start gap-4 p-5">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
              <Icon size={20} strokeWidth={2.25} />
            </span>
            <p className="pt-1.5 text-sand-800">{t(`landing.${key}`)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
