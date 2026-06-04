import type { ReactNode } from "react";
import { Link, redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import {
  DEFAULT_LOCALE,
  type Locale,
  type ShellSection,
  localePath,
  resolveLocale,
  routeSectionFromPathname,
} from "../lib/locale";

type Copy = {
  navPublic: string;
  navMember: string;
  navAdmin: string;
  eyebrow: string;
  title: string;
  body: string;
  memberCta: string;
  adminCta: string;
  statusLabel: string;
  publicStatus: string;
  memberStatus: string;
  adminStatus: string;
};

const COPY: Record<Locale, Copy> = {
  ca: {
    navPublic: "Inici",
    navMember: "Membres",
    navAdmin: "Administració",
    eyebrow: "Club d'Escacs Calella",
    title: "Una nova interfície React per al club",
    body: "Aquesta primera versió valida el desplegament, la navegació localitzada i les rutes de proxy abans de migrar els fluxos complets.",
    memberCta: "Veure àrea de membres",
    adminCta: "Veure administració",
    statusLabel: "Secció actual",
    publicStatus: "Pàgina pública",
    memberStatus: "Àrea de membres",
    adminStatus: "Àrea d'administració",
  },
  es: {
    navPublic: "Inicio",
    navMember: "Miembros",
    navAdmin: "Administración",
    eyebrow: "Club de Ajedrez Calella",
    title: "Una nueva interfaz React para el club",
    body: "Esta primera versión valida el despliegue, la navegación localizada y las rutas de proxy antes de migrar los flujos completos.",
    memberCta: "Ver área de miembros",
    adminCta: "Ver administración",
    statusLabel: "Sección actual",
    publicStatus: "Página pública",
    memberStatus: "Área de miembros",
    adminStatus: "Área de administración",
  },
  en: {
    navPublic: "Home",
    navMember: "Members",
    navAdmin: "Admin",
    eyebrow: "Calella Chess Club",
    title: "A new React interface for the club",
    body: "This first version validates deployment, localized navigation, and same-origin proxy routes before migrating the complete workflows.",
    memberCta: "View member area",
    adminCta: "View admin area",
    statusLabel: "Current section",
    publicStatus: "Public page",
    memberStatus: "Member area",
    adminStatus: "Admin area",
  },
};

const SECTION_STATUS: Record<ShellSection, keyof Pick<Copy, "publicStatus" | "memberStatus" | "adminStatus">> =
  {
    public: "publicStatus",
    member: "memberStatus",
    admin: "adminStatus",
  };

export const meta: MetaFunction = () => [
  { title: "Calella Chess Club" },
  {
    name: "description",
    content: "React Router shell for the Calella Chess Club website.",
  },
];

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    throw redirect(localePath(DEFAULT_LOCALE));
  }

  const locale = resolveLocale(params.locale);
  const section = routeSectionFromPathname(url.pathname);

  return {
    locale,
    section,
    copy: COPY[locale],
    sectionStatus: COPY[locale][SECTION_STATUS[section]],
  };
}

export default function HomeRoute() {
  const { locale, section, copy, sectionStatus } =
    useLoaderData<typeof loader>();

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-stone-950">
      <header className="border-b border-stone-200 bg-white/85">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link className="text-base font-semibold" to={localePath(locale)}>
            Calella Chess Club
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <NavLink active={section === "public"} to={localePath(locale)}>
              {copy.navPublic}
            </NavLink>
            <NavLink active={section === "member"} to={localePath(locale, "member")}>
              {copy.navMember}
            </NavLink>
            <NavLink active={section === "admin"} to={localePath(locale, "admin")}>
              {copy.navAdmin}
            </NavLink>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {(["ca", "es", "en"] as const).map((targetLocale) => (
              <Link
                className={`rounded px-2.5 py-1.5 font-medium ${
                  targetLocale === locale
                    ? "bg-stone-950 text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
                }`}
                key={targetLocale}
                to={localePath(targetLocale, section)}
              >
                {targetLocale.toUpperCase()}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[1fr_420px] md:items-center md:py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-stone-700">{copy.body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="rounded bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
              to={localePath(locale, "member")}
            >
              {copy.memberCta}
            </Link>
            <Link
              className="rounded border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-stone-100"
              to={localePath(locale, "admin")}
            >
              {copy.adminCta}
            </Link>
          </div>
          <div className="mt-8 inline-flex items-center gap-2 rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700">
            <span className="font-semibold text-stone-950">{copy.statusLabel}</span>
            <span>{sectionStatus}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded border border-stone-200 bg-white shadow-sm">
          <img
            alt="Calella chess club room"
            className="aspect-[4/3] h-full w-full object-cover"
            src="/images/club-hero.png"
          />
        </div>
      </section>
    </main>
  );
}

function NavLink({
  active,
  children,
  to,
}: {
  active: boolean;
  children: ReactNode;
  to: string;
}) {
  return (
    <Link
      className={`rounded px-3 py-2 font-medium ${
        active
          ? "bg-emerald-700 text-white"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
      }`}
      to={to}
    >
      {children}
    </Link>
  );
}
