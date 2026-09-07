import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "../nav";

/**
 * Mobile-only thumb-reach tab bar. Research on low-literacy / first-time
 * smartphone users consistently favours a persistent, icon+label bottom
 * bar over a hidden hamburger menu — nothing to discover, nothing to
 * remember, one thumb's reach away. Desktop gets the full Navbar instead.
 */
export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-sand-100 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.7rem] font-medium transition-colors ${
              isActive ? "text-moss-700" : "text-sand-400"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
              {t(`nav.${key}`)}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
