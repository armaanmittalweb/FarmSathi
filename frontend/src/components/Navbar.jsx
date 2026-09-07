import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { LogIn, LogOut, User } from "lucide-react";
import { logout } from "../store/authSlice";
import { NAV_ITEMS } from "../nav";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import Button from "./ui/Button";

const linkClasses = ({ isActive }) =>
  `flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-moss-50 text-moss-700" : "text-sand-600 hover:text-sand-900"
  }`;

export default function Navbar() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  return (
    <header className="sticky top-0 z-20 border-b border-sand-100 bg-sand-25/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <NavLink to="/" className="shrink-0">
          <Logo />
        </NavLink>

        {/* Full nav: desktop only. Mobile gets the thumb-reach BottomNav
            instead — more discoverable for a farmer than a hidden hamburger. */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClasses}>
              <Icon size={17} strokeWidth={2.25} />
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Button as={NavLink} to="/profile" variant="ghost" size="sm" icon={User} className="!px-2.5 sm:!px-3.5">
                <span className="hidden sm:inline">{t("nav.profile")}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={LogOut}
                className="!px-2.5 sm:!px-3.5"
                onClick={() => {
                  dispatch(logout());
                  navigate("/");
                }}
              >
                <span className="hidden sm:inline">{t("nav.logout")}</span>
              </Button>
            </div>
          ) : (
            <Button as={NavLink} to="/login" variant="primary" size="sm" icon={LogIn} className="!px-3.5">
              <span className="hidden sm:inline">{t("nav.login")}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
