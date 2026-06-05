import { useEffect, useState } from "react";
import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { SiteHeader } from "../components/SiteHeader";
import { verifyEmailToken } from "../lib/account-api";
import {
  type Locale,
  forgotPasswordPath,
  localeFromPathname,
  loginPath,
  registerPath,
  verifyEmailPath,
} from "../lib/locale";

type VerifyEmailCopy = {
  title: string;
  checking: string;
  success: string;
  missingToken: string;
  loginCta: string;
  registerCta: string;
  forgotPassword: string;
};

const VERIFY_EMAIL_COPY: Record<Locale, VerifyEmailCopy> = {
  ca: {
    title: "Verificació del correu",
    checking: "Verificant el correu...",
    success:
      "Correu verificat. La teva sol·licitud de soci està pendent d'aprovació.",
    missingToken: "L'enllaç de verificació no inclou cap token.",
    loginCta: "Entrar",
    registerCta: "Registrar-se",
    forgotPassword: "Recuperar contrasenya",
  },
  es: {
    title: "Verificación del correo",
    checking: "Verificando el correo...",
    success:
      "Correo verificado. Tu solicitud de socio está pendiente de aprobación.",
    missingToken: "El enlace de verificación no incluye ningún token.",
    loginCta: "Iniciar sesión",
    registerCta: "Registrarse",
    forgotPassword: "Recuperar contraseña",
  },
  en: {
    title: "Email verification",
    checking: "Verifying your email...",
    success: "Email verified. Your membership request is pending approval.",
    missingToken: "The verification link does not include a token.",
    loginCta: "Log in",
    registerCta: "Register",
    forgotPassword: "Recover password",
  },
};

type VerificationStatus = "checking" | "success" | "error";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data
      ? `${data.copy.title} | Calella Chess Club`
      : "Email verification",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const locale = localeFromPathname(url.pathname);

  return {
    locale,
    token: url.searchParams.get("token") ?? "",
    copy: VERIFY_EMAIL_COPY[locale],
  };
}

export function messageForVerificationErrorCode(code: string) {
  const messages: Record<string, string> = {
    AUTH_VERIFICATION_TOKEN_INVALID: "This verification link is invalid.",
    AUTH_VERIFICATION_TOKEN_USED:
      "This verification link has already been used.",
    AUTH_VERIFICATION_TOKEN_EXPIRED: "This verification link has expired.",
    NETWORK_ERROR: "Network error. Check your connection and try again.",
  };

  return messages[code] ?? "Email verification failed.";
}

export default function VerifyEmailRoute() {
  const { locale, token, copy } = useLoaderData<typeof loader>();
  const [status, setStatus] = useState<VerificationStatus>(
    token ? "checking" : "error",
  );
  const [message, setMessage] = useState(token ? copy.checking : copy.missingToken);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    async function verify() {
      const result = await verifyEmailToken(token);
      if (!active) {
        return;
      }

      if (result.ok) {
        setStatus("success");
        setMessage(copy.success);
        return;
      }

      setStatus("error");
      setMessage(messageForVerificationErrorCode(result.code));
    }

    void verify();

    return () => {
      active = false;
    };
  }, [copy.success, token]);

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-stone-950">
      <SiteHeader
        activeSection="public"
        languagePath={(targetLocale) => verifyEmailPath(targetLocale, token)}
        locale={locale}
      />

      <section className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Calella Chess Club
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
          {copy.title}
        </h1>
        <p
          className={`mt-6 rounded border px-4 py-3 text-base leading-7 ${
            status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : status === "checking"
                ? "border-stone-200 bg-white text-stone-700"
                : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
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
            {copy.forgotPassword}
          </Link>
        </div>
      </section>
    </main>
  );
}
