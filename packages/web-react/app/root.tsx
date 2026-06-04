import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import "./styles/tailwind.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ca">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Unexpected application error";

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16 text-stone-950">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Calella Chess Club
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{message}</h1>
      </div>
    </main>
  );
}
