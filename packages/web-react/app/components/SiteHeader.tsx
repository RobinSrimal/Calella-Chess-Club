import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getCurrentUser, type PublicUser } from "../lib/account-api";
import {
  SUPPORTED_LOCALES,
  type Locale,
  type ShellSection,
  localePath,
} from "../lib/locale";
import { visibleSiteNavItems } from "../lib/site-nav";

type SiteHeaderProps = {
  locale: Locale;
  activeSection: ShellSection;
  languagePath: (locale: Locale) => string;
};

export function SiteHeader({
  activeSection,
  languagePath,
  locale,
}: SiteHeaderProps) {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const result = await getCurrentUser();
      if (!active) {
        return;
      }

      setCurrentUser(result.ok ? result.data.user : null);
    }

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="border-b border-stone-200 bg-white/85">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link className="text-base font-semibold" to={localePath(locale)}>
          Calella Chess Club
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {visibleSiteNavItems({ currentUser, locale }).map((item) => (
            <Link
              className={`rounded px-3 py-2 font-medium ${
                isActiveNavItem(item.id, item.section, activeSection)
                  ? "bg-emerald-700 text-white"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
              key={item.id}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm">
          {SUPPORTED_LOCALES.map((targetLocale) => (
            <Link
              className={`rounded px-2.5 py-1.5 font-medium ${
                targetLocale === locale
                  ? "bg-stone-950 text-white"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
              key={targetLocale}
              to={languagePath(targetLocale)}
            >
              {targetLocale.toUpperCase()}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

function isActiveNavItem(
  id: string,
  section: ShellSection,
  activeSection: ShellSection,
) {
  if (id === "home") {
    return activeSection === "public";
  }

  return section === activeSection;
}
