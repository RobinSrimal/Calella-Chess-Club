import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { SiteHeader } from "../components/SiteHeader";
import {
  type Locale,
  forgotPasswordPath,
  localeFromPathname,
  loginPath,
  registerPath,
  resetPasswordPath,
} from "../lib/locale";

type PasswordUtilityCopy = {
  title: string;
  body: string;
  loginCta: string;
  registerCta: string;
  resetLink: string;
};

const FORGOT_PASSWORD_COPY: Record<Locale, PasswordUtilityCopy> = {
  ca: {
    title: "Recuperar contrasenya",
    body: "La recuperació automàtica de contrasenya encara no està activada. Contacta amb un administrador del club per rebre ajuda.",
    loginCta: "Entrar",
    registerCta: "Registrar-se",
    resetLink: "Restablir contrasenya",
  },
  es: {
    title: "Recuperar contraseña",
    body: "La recuperación automática de contraseña aún no está activada. Contacta con un administrador del club para recibir ayuda.",
    loginCta: "Iniciar sesión",
    registerCta: "Registrarse",
    resetLink: "Restablecer contraseña",
  },
  en: {
    title: "Recover password",
    body: "Automatic password recovery is not enabled yet. Contact a club admin for help.",
    loginCta: "Log in",
    registerCta: "Register",
    resetLink: "Reset password",
  },
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data
      ? `${data.copy.title} | Calella Chess Club`
      : "Recover password",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const locale = localeFromPathname(url.pathname);

  return {
    locale,
    copy: FORGOT_PASSWORD_COPY[locale],
  };
}

export default function ForgotPasswordRoute() {
  const { locale, copy } = useLoaderData<typeof loader>();

  return (
    <PasswordUtilityLayout
      languagePath={forgotPasswordPath}
      locale={locale}
      resetHref={resetPasswordPath(locale)}
      showResetLink
      {...copy}
    />
  );
}

function PasswordUtilityLayout({
  body,
  languagePath,
  locale,
  loginCta,
  registerCta,
  resetHref,
  resetLink,
  showResetLink = false,
  title,
}: PasswordUtilityCopy & {
  languagePath: (locale: Locale) => string;
  locale: Locale;
  resetHref: string;
  showResetLink?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#f8f7f2] text-stone-950">
      <SiteHeader
        activeSection="public"
        languagePath={languagePath}
        locale={locale}
      />

      <section className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Calella Chess Club
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
          {title}
        </h1>
        <p className="mt-6 rounded border border-stone-200 bg-white px-4 py-3 text-base leading-7 text-stone-700">
          {body}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            className="rounded bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
            to={loginPath(locale)}
          >
            {loginCta}
          </Link>
          <Link
            className="rounded border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-stone-100"
            to={registerPath(locale)}
          >
            {registerCta}
          </Link>
          {showResetLink ? (
            <Link
              className="rounded border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-stone-100"
              to={resetHref}
            >
              {resetLink}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
