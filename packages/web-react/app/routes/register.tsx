import { type FormEvent, useState } from "react";
import { Link, redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import {
  DEFAULT_LOCALE,
  type Locale,
  loginPath,
  localePath,
  registerPath,
  resolveLocale,
} from "../lib/locale";

type RegisterCopy = {
  navPublic: string;
  navLogin: string;
  navRegister: string;
  title: string;
  body: string;
  usernameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
};

const REGISTER_COPY: Record<Locale, RegisterCopy> = {
  ca: {
    navPublic: "Inici",
    navLogin: "Entrar",
    navRegister: "Registrar-se",
    title: "Crear un compte",
    body: "Crea el teu compte. Despres cal verificar el correu i esperar l'aprovacio de soci.",
    usernameLabel: "Nom d'usuari",
    emailLabel: "Correu electronic",
    passwordLabel: "Contrasenya",
    submit: "Registrar-se",
    submitting: "Registrant...",
    success: "Compte creat. Revisa el correu per verificar-lo.",
    error: "No s'ha pogut crear el compte. Revisa les dades.",
  },
  es: {
    navPublic: "Inicio",
    navLogin: "Iniciar sesion",
    navRegister: "Registrarse",
    title: "Crear una cuenta",
    body: "Crea tu cuenta. Despues hay que verificar el correo y esperar la aprobacion de socio.",
    usernameLabel: "Nombre de usuario",
    emailLabel: "Correo electronico",
    passwordLabel: "Contrasena",
    submit: "Registrarse",
    submitting: "Registrando...",
    success: "Cuenta creada. Revisa el correo para verificarla.",
    error: "No se ha podido crear la cuenta. Revisa los datos.",
  },
  en: {
    navPublic: "Home",
    navLogin: "Log in",
    navRegister: "Register",
    title: "Create an account",
    body: "Create your account. After registration you need to verify your email and wait for membership approval.",
    usernameLabel: "Username",
    emailLabel: "Email",
    passwordLabel: "Password",
    submit: "Register",
    submitting: "Registering...",
    success: "Account created. Check your email to verify it.",
    error: "Could not create the account. Check the form details.",
  },
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data
      ? `${data.copy.title} | Calella Chess Club`
      : "Create an account",
  },
];

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (url.pathname === "/register") {
    throw redirect(registerPath(DEFAULT_LOCALE));
  }

  const locale = resolveLocale(params.locale);

  return {
    locale,
    copy: REGISTER_COPY[locale],
  };
}

export default function RegisterRoute() {
  const { locale, copy } = useLoaderData<typeof loader>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, password, locale }),
      });

      if (!response.ok) {
        setError(copy.error);
        return;
      }

      setMessage(copy.success);
      event.currentTarget.reset();
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
            <AuthNavLink to={localePath(locale)}>{copy.navPublic}</AuthNavLink>
            <AuthNavLink to={loginPath(locale)}>{copy.navLogin}</AuthNavLink>
            <AuthNavLink active to={registerPath(locale)}>
              {copy.navRegister}
            </AuthNavLink>
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
                to={registerPath(targetLocale)}
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
                name="username"
                required
                type="text"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              {copy.emailLabel}
              <input
                autoComplete="email"
                className="rounded border border-stone-300 px-3 py-2.5 text-base font-normal text-stone-950 outline-none focus:border-emerald-700"
                name="email"
                required
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              {copy.passwordLabel}
              <input
                autoComplete="new-password"
                className="rounded border border-stone-300 px-3 py-2.5 text-base font-normal text-stone-950 outline-none focus:border-emerald-700"
                minLength={12}
                name="password"
                required
                type="password"
              />
            </label>
          </div>

          {message ? (
            <p
              className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              role="status"
            >
              {message}
            </p>
          ) : null}

          {error ? (
            <p
              className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
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

function AuthNavLink({
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
