import type { ReactNode } from "react";
import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import {
  type Locale,
  forgotPasswordPath,
  localeFromPathname,
  localePath,
  loginPath,
  registerPath,
  resetPasswordPath,
} from "../lib/locale";

type PasswordUtilityCopy = {
  navPublic: string;
  navLogin: string;
  navRegister: string;
  title: string;
  body: string;
  loginCta: string;
  registerCta: string;
  forgotLink: string;
};

const RESET_PASSWORD_COPY: Record<Locale, PasswordUtilityCopy> = {
  ca: {
    navPublic: "Inici",
    navLogin: "Entrar",
    navRegister: "Registrar-se",
    title: "Restablir contrasenya",
    body: "Els enllaços de restabliment de contrasenya encara no estan activats.",
    loginCta: "Entrar",
    registerCta: "Registrar-se",
    forgotLink: "Recuperar contrasenya",
  },
  es: {
    navPublic: "Inicio",
    navLogin: "Iniciar sesión",
    navRegister: "Registrarse",
    title: "Restablecer contraseña",
    body: "Los enlaces para restablecer la contraseña aún no están activados.",
    loginCta: "Iniciar sesión",
    registerCta: "Registrarse",
    forgotLink: "Recuperar contraseña",
  },
  en: {
    navPublic: "Home",
    navLogin: "Log in",
    navRegister: "Register",
    title: "Reset password",
    body: "Password reset links are not enabled yet.",
    loginCta: "Log in",
    registerCta: "Register",
    forgotLink: "Recover password",
  },
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data ? `${data.copy.title} | Calella Chess Club` : "Reset password",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const locale = localeFromPathname(url.pathname);

  return {
    locale,
    copy: RESET_PASSWORD_COPY[locale],
  };
}

export default function ResetPasswordRoute() {
  const { locale, copy } = useLoaderData<typeof loader>();

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-stone-950">
      <header className="border-b border-stone-200 bg-white/85">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link className="text-base font-semibold" to={localePath(locale)}>
            Calella Chess Club
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <NavLink to={localePath(locale)}>{copy.navPublic}</NavLink>
            <NavLink to={loginPath(locale)}>{copy.navLogin}</NavLink>
            <NavLink to={registerPath(locale)}>{copy.navRegister}</NavLink>
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
                to={resetPasswordPath(targetLocale)}
              >
                {targetLocale.toUpperCase()}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Calella Chess Club
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-6 rounded border border-stone-200 bg-white px-4 py-3 text-base leading-7 text-stone-700">
          {copy.body}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            className="rounded bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
            to={loginPath(locale)}
          >
            {copy.loginCta}
          </Link>
          <Link
            className="rounded border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-stone-100"
            to={registerPath(locale)}
          >
            {copy.registerCta}
          </Link>
          <Link
            className="rounded border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-stone-100"
            to={forgotPasswordPath(locale)}
          >
            {copy.forgotLink}
          </Link>
        </div>
      </section>
    </main>
  );
}

function NavLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <Link
      className="rounded px-3 py-2 font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950"
      to={to}
    >
      {children}
    </Link>
  );
}
