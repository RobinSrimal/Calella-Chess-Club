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
  forgotLink: string;
};

const RESET_PASSWORD_COPY: Record<Locale, PasswordUtilityCopy> = {
  ca: {
    title: "Restablir contrasenya",
    body: "Els enllaços de restabliment de contrasenya encara no estan activats.",
    loginCta: "Entrar",
    registerCta: "Registrar-se",
    forgotLink: "Recuperar contrasenya",
  },
  es: {
    title: "Restablecer contraseña",
    body: "Los enlaces para restablecer la contraseña aún no están activados.",
    loginCta: "Iniciar sesión",
    registerCta: "Registrarse",
    forgotLink: "Recuperar contraseña",
  },
  en: {
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
      <SiteHeader
        activeSection="public"
        languagePath={resetPasswordPath}
        locale={locale}
      />

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
