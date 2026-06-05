import { type FormEvent, useEffect, useState } from "react";
import { redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { SiteHeader } from "../components/SiteHeader";
import { getCurrentUser } from "../lib/account-api";
import {
  DEFAULT_LOCALE,
  type Locale,
  localeFromPathname,
  localePath,
  registerPath,
  resolveLocale,
} from "../lib/locale";

type RegisterCopy = {
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

  const locale = resolveLocale(params.locale ?? localeFromPathname(url.pathname));

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

  useEffect(() => {
    let active = true;

    async function redirectIfAlreadyLoggedIn() {
      const result = await getCurrentUser();
      if (active && result.ok) {
        window.location.assign(localePath(locale, "member"));
      }
    }

    void redirectIfAlreadyLoggedIn();

    return () => {
      active = false;
    };
  }, [locale]);

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
      <SiteHeader
        activeSection="public"
        languagePath={registerPath}
        locale={locale}
      />

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
