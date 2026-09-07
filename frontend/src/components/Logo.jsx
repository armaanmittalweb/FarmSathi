import { useTranslation } from "react-i18next";

/**
 * A small bespoke mark (not an icon-font glyph, not an emoji) so the brand
 * has an actual identity instead of a 🌾 borrowed from the system font.
 */
export default function Logo({ withWordmark = true, className = "" }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 21V11" stroke="currentColor" className="text-moss-700" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 11c0-5 5-6 7-8 0 5-3 8-7 8Z" className="fill-moss-500" />
        <path d="M12 14.5c0-3.5-3.5-4.5-5-6-0 4 2.5 6 5 6Z" className="fill-moss-300" />
      </svg>
      {withWordmark && <span className="text-lg font-bold tracking-tight text-sand-900">{t("appName")}</span>}
    </span>
  );
}
