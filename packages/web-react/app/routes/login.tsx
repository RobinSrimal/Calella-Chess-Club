import { type FormEvent, useState } from "react";
import { Link, redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import {
  DEFAULT_LOCALE,
  type Locale,
  localeFromPathname,
  loginPath,
  localePath,
  registerPath,
  resolveLocale,
} from "../lib/locale";

type LoginCopy = {
  navPublic: string;
  navMember: string;
  navLogin: string;
  navRegister: string;
  title: string;
  body: string;
  usernameLabel: string;
  passwordLabel: string;
  submit: string;
  submitting: string;
  error: string;
};

const LOGIN_COPY: Record<Locale, LoginCopy> = {
  ca: {
    navPublic: "Inici",
    navMember: "Membres",
    navLogin: "Entrar",
    navRegister: "Registrar-se",
    title: "Entrar al compte",
    body: "Accedeix amb el teu usuari o correu per continuar cap a l'àrea de membres.",
    usernameLabel: "Usuari o correu",
    passwordLabel: "Contrasenya",
    submit: "Entrar",
    submitting: "Entrant...",
    error: "No s'ha pogut iniciar sessio. Revisa les credencials.",
  },
  es: {
    navPublic: "Inicio",
    navMember: "Miembros",
    navLogin: "Iniciar sesion",
    navRegister: "Registrarse",
    title: "Iniciar sesion",
    body: "Accede con tu usuario o correo para continuar al area de miembros.",
    usernameLabel: "Usuario o correo",
    passwordLabel: "Contrasena",
    submit: "Entrar",
    submitting: "Entrando...",
    error: "No se ha podido iniciar sesion. Revisa las credenciales.",
  },
  en: {
    navPublic: "Home",
    navMember: "Members",
    navLogin: "Log in",
    navRegister: "Register",
    title: "Log in",
    body: "Use your username or email to continue to the member area.",
    usernameLabel: "Username or email",
    passwordLabel: "Password",
    submit: "Log in",
    submitting: "Logging in...",
    error: "Login failed. Check your credentials.",
  },
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? `${data.copy.title} | Calella Chess Club` : "Log in" },
];

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (url.pathname === "/login") {
    throw redirect(loginPath(DEFAULT_LOCALE));
  }

  const locale = resolveLocale(params.locale ?? localeFromPathname(url.pathname));

  return {
    locale,
    copy: LOGIN_COPY[locale],
  };
}

export default function LoginRoute() {
  const { locale, copy } = useLoaderData<typeof loader>();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const usernameOrEmail = String(form.get("usernameOrEmail") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      if (!response.ok) {
        setError(copy.error);
        return;
      }

      window.location.assign(localePath(locale, "member"));
    } catch {
      setError(copy.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-stone-950">
      <header className="border-b border-stone-200 bg-white/85">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link className="text-base font-semibold" to={localePath(locale)}>
            Calella Chess Club
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <LoginNavLink to={localePath(locale)}>{copy.navPublic}</LoginNavLink>
            <LoginNavLink to={localePath(locale, "member")}>
              {copy.navMember}
            </LoginNavLink>
            <LoginNavLink active to={loginPath(locale)}>
              {copy.navLogin}
            </LoginNavLink>
            <LoginNavLink to={registerPath(locale)}>
              {copy.navRegister}
            </LoginNavLink>
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
                to={loginPath(targetLocale)}
              >
                {targetLocale.toUpperCase()}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[1fr_420px] md:items-start md:py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Calella Chess Club
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-stone-700">{copy.body}</p>
        </div>

        <form
          className="rounded border border-stone-200 bg-white p-5 shadow-sm"
          method="post"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              {copy.usernameLabel}
              <input
                autoComplete="username"
                className="rounded border border-stone-300 px-3 py-2.5 text-base font-normal text-stone-950 outline-none focus:border-emerald-700"
                name="usernameOrEmail"
                required
                type="text"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              {copy.passwordLabel}
              <input
                autoComplete="current-password"
                className="rounded border border-stone-300 px-3 py-2.5 text-base font-normal text-stone-950 outline-none focus:border-emerald-700"
                name="password"
                required
                type="password"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <button
            className="mt-5 w-full rounded bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-500"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? copy.submitting : copy.submit}
          </button>
        </form>
      </section>
    </main>
  );
}

function LoginNavLink({
  active = false,
  children,
  to,
}: {
  active?: boolean;
  children: string;
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
