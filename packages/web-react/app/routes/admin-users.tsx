import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import {
  type AccountStatus,
  type AdminUserFilters,
  type AdminUserSummary,
  type MembershipStatus,
  type PublicUser,
  type UserRole,
  approveMembership,
  disableUser,
  getCurrentUser,
  listAdminUsers,
  rejectMembership,
  restoreMembership,
} from "../lib/account-api";
import {
  type AdminUserActionKind,
  messageForAdminUserErrorCode,
  sortAdminUsers,
  visibleAdminUserActions,
} from "../lib/admin-users-state";
import {
  type Locale,
  adminUsersPath,
  localeFromPathname,
  localePath,
  loginPath,
} from "../lib/locale";

type AdminUsersCopy = {
  navPublic: string;
  navAdmin: string;
  navLogin: string;
  title: string;
  body: string;
  filters: {
    membershipStatus: string;
    role: string;
    accountStatus: string;
    all: string;
    none: string;
    pending: string;
    member: string;
    rejected: string;
    user: string;
    admin: string;
    active: string;
    disabled: string;
  };
  states: {
    loadingSession: string;
    loginRequired: string;
    forbidden: string;
    loadingUsers: string;
    empty: string;
  };
  fields: {
    email: string;
    emailVerified: string;
    emailUnverified: string;
    createdAt: string;
    disabledAt: string;
    currentAdmin: string;
  };
  actions: Record<AdminUserActionKind, string>;
  success: Record<AdminUserActionKind, string>;
};

type AuthState = "loading" | "login-required" | "forbidden" | "ready";

const ADMIN_USERS_COPY: Record<Locale, AdminUsersCopy> = {
  ca: {
    navPublic: "Inici",
    navAdmin: "Administració",
    navLogin: "Entrar",
    title: "Gestió d'usuaris",
    body: "Revisa sol·licituds de soci i gestiona l'estat dels comptes.",
    filters: {
      membershipStatus: "Estat de soci",
      role: "Rol",
      accountStatus: "Estat del compte",
      all: "Tots",
      none: "Sense sol·licitud",
      pending: "Pendent",
      member: "Soci",
      rejected: "Rebutjat",
      user: "Usuari",
      admin: "Admin",
      active: "Actiu",
      disabled: "Desactivat",
    },
    states: {
      loadingSession: "Comprovant la sessió...",
      loginRequired: "Cal iniciar sessió per veure l'administració.",
      forbidden: "Només els administradors actius poden gestionar usuaris.",
      loadingUsers: "Carregant usuaris...",
      empty: "No hi ha usuaris amb aquests filtres.",
    },
    fields: {
      email: "Correu",
      emailVerified: "Correu verificat",
      emailUnverified: "Correu pendent",
      createdAt: "Creat",
      disabledAt: "Desactivat",
      currentAdmin: "Tu",
    },
    actions: {
      "approve-membership": "Aprovar",
      "reject-membership": "Rebutjar",
      "restore-membership": "Restaurar",
      disable: "Desactivar",
    },
    success: {
      "approve-membership": "Sol·licitud aprovada.",
      "reject-membership": "Sol·licitud rebutjada.",
      "restore-membership": "Sol·licitud restaurada.",
      disable: "Compte desactivat.",
    },
  },
  es: {
    navPublic: "Inicio",
    navAdmin: "Administración",
    navLogin: "Iniciar sesión",
    title: "Gestión de usuarios",
    body: "Revisa solicitudes de socio y gestiona el estado de las cuentas.",
    filters: {
      membershipStatus: "Estado de socio",
      role: "Rol",
      accountStatus: "Estado de cuenta",
      all: "Todos",
      none: "Sin solicitud",
      pending: "Pendiente",
      member: "Socio",
      rejected: "Rechazado",
      user: "Usuario",
      admin: "Admin",
      active: "Activo",
      disabled: "Desactivado",
    },
    states: {
      loadingSession: "Comprobando la sesión...",
      loginRequired: "Hay que iniciar sesión para ver la administración.",
      forbidden: "Solo los administradores activos pueden gestionar usuarios.",
      loadingUsers: "Cargando usuarios...",
      empty: "No hay usuarios con estos filtros.",
    },
    fields: {
      email: "Correo",
      emailVerified: "Correo verificado",
      emailUnverified: "Correo pendiente",
      createdAt: "Creado",
      disabledAt: "Desactivado",
      currentAdmin: "Tú",
    },
    actions: {
      "approve-membership": "Aprobar",
      "reject-membership": "Rechazar",
      "restore-membership": "Restaurar",
      disable: "Desactivar",
    },
    success: {
      "approve-membership": "Solicitud aprobada.",
      "reject-membership": "Solicitud rechazada.",
      "restore-membership": "Solicitud restaurada.",
      disable: "Cuenta desactivada.",
    },
  },
  en: {
    navPublic: "Home",
    navAdmin: "Admin",
    navLogin: "Log in",
    title: "User management",
    body: "Review membership requests and manage account status.",
    filters: {
      membershipStatus: "Membership status",
      role: "Role",
      accountStatus: "Account status",
      all: "All",
      none: "No request",
      pending: "Pending",
      member: "Member",
      rejected: "Rejected",
      user: "User",
      admin: "Admin",
      active: "Active",
      disabled: "Disabled",
    },
    states: {
      loadingSession: "Checking session...",
      loginRequired: "Log in to view the admin area.",
      forbidden: "Only active admins can manage users.",
      loadingUsers: "Loading users...",
      empty: "No users match these filters.",
    },
    fields: {
      email: "Email",
      emailVerified: "Email verified",
      emailUnverified: "Email pending",
      createdAt: "Created",
      disabledAt: "Disabled",
      currentAdmin: "You",
    },
    actions: {
      "approve-membership": "Approve",
      "reject-membership": "Reject",
      "restore-membership": "Restore",
      disable: "Disable",
    },
    success: {
      "approve-membership": "Membership request approved.",
      "reject-membership": "Membership request rejected.",
      "restore-membership": "Membership request restored.",
      disable: "Account disabled.",
    },
  },
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data
      ? `${data.copy.title} | Calella Chess Club`
      : "User management",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const locale = localeFromPathname(url.pathname);

  return {
    locale,
    copy: ADMIN_USERS_COPY[locale],
  };
}

export function canUseAdminUsers(user: PublicUser | null) {
  return user?.role === "admin";
}

export default function AdminUsersRoute() {
  const { locale, copy } = useLoaderData<typeof loader>();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [filters, setFilters] = useState<AdminUserFilters>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const result = await getCurrentUser();
      if (!active) {
        return;
      }

      if (!result.ok) {
        setAuthState(
          result.code === "API_AUTH_REQUIRED" || result.code === "API_AUTH_INVALID"
            ? "login-required"
            : "forbidden",
        );
        setError(messageForAdminUserErrorCode(result.code));
        return;
      }

      if (!canUseAdminUsers(result.data.user)) {
        setAuthState("forbidden");
        setError("");
        return;
      }

      setCurrentUser(result.data.user);
      setAuthState("ready");
      setError("");
    }

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authState !== "ready") {
      return;
    }

    let active = true;

    async function loadUsers() {
      setIsLoadingUsers(true);
      setError("");

      const result = await listAdminUsers(filters);
      if (!active) {
        return;
      }

      setIsLoadingUsers(false);
      if (result.ok) {
        setUsers(sortAdminUsers(result.data.users));
        return;
      }

      setUsers([]);
      setError(messageForAdminUserErrorCode(result.code));
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, [authState, filters.accountStatus, filters.membershipStatus, filters.role]);

  const sortedUsers = useMemo(() => sortAdminUsers(users), [users]);

  function updateMembershipFilter(value: string) {
    setFilters((current) => ({
      ...current,
      membershipStatus: value ? (value as MembershipStatus) : undefined,
    }));
  }

  function updateRoleFilter(value: string) {
    setFilters((current) => ({
      ...current,
      role: value ? (value as UserRole) : undefined,
    }));
  }

  function updateAccountStatusFilter(value: string) {
    setFilters((current) => ({
      ...current,
      accountStatus: value ? (value as AccountStatus) : undefined,
    }));
  }

  async function handleAction(
    user: AdminUserSummary,
    action: AdminUserActionKind,
  ) {
    setPendingAction(`${user.id}:${action}`);
    setError("");
    setSuccess("");

    const result = await runAdminUserAction(user.id, action);
    if (result.ok) {
      setUsers((current) =>
        sortAdminUsers(
          current.map((candidate) =>
            candidate.id === result.data.user.id ? result.data.user : candidate,
          ),
        ),
      );
      setSuccess(copy.success[action]);
    } else {
      setError(messageForAdminUserErrorCode(result.code));
    }

    setPendingAction("");
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-stone-950">
      <header className="border-b border-stone-200 bg-white/85">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link className="text-base font-semibold" to={localePath(locale)}>
            Calella Chess Club
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <AdminNavLink to={localePath(locale)}>{copy.navPublic}</AdminNavLink>
            <AdminNavLink active to={adminUsersPath(locale)}>
              {copy.navAdmin}
            </AdminNavLink>
            <AdminNavLink to={loginPath(locale)}>{copy.navLogin}</AdminNavLink>
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
                to={adminUsersPath(targetLocale)}
              >
                {targetLocale.toUpperCase()}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Calella Chess Club
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-stone-700">{copy.body}</p>
        </div>

        <AdminStateMessage
          authState={authState}
          copy={copy}
          error={error}
          locale={locale}
        />

        {authState === "ready" && currentUser ? (
          <div className="mt-7">
            <FilterBar
              copy={copy}
              filters={filters}
              onAccountStatusChange={updateAccountStatusFilter}
              onMembershipChange={updateMembershipFilter}
              onRoleChange={updateRoleFilter}
            />

            {success ? (
              <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {success}
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            {isLoadingUsers ? (
              <p className="mt-5 rounded border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                {copy.states.loadingUsers}
              </p>
            ) : null}

            {!isLoadingUsers && sortedUsers.length === 0 ? (
              <p className="mt-5 rounded border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                {copy.states.empty}
              </p>
            ) : null}

            <div className="mt-5 grid gap-3">
              {sortedUsers.map((user) => (
                <AdminUserCard
                  copy={copy}
                  currentUserId={currentUser.id}
                  key={user.id}
                  onAction={handleAction}
                  pendingAction={pendingAction}
                  user={user}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function AdminStateMessage({
  authState,
  copy,
  error,
  locale,
}: {
  authState: AuthState;
  copy: AdminUsersCopy;
  error: string;
  locale: Locale;
}) {
  if (authState === "ready") {
    return null;
  }

  const message =
    authState === "loading"
      ? copy.states.loadingSession
      : authState === "login-required"
        ? error || copy.states.loginRequired
        : error || copy.states.forbidden;

  return (
    <div className="mt-7 rounded border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
      <p>{message}</p>
      {authState === "login-required" ? (
        <Link
          className="mt-3 inline-flex rounded bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
          to={loginPath(locale)}
        >
          {copy.navLogin}
        </Link>
      ) : null}
    </div>
  );
}

function FilterBar({
  copy,
  filters,
  onAccountStatusChange,
  onMembershipChange,
  onRoleChange,
}: {
  copy: AdminUsersCopy;
  filters: AdminUserFilters;
  onAccountStatusChange: (value: string) => void;
  onMembershipChange: (value: string) => void;
  onRoleChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded border border-stone-200 bg-white p-4 md:grid-cols-3">
      <SelectFilter
        label={copy.filters.membershipStatus}
        onChange={onMembershipChange}
        options={[
          ["", copy.filters.all],
          ["none", copy.filters.none],
          ["pending", copy.filters.pending],
          ["member", copy.filters.member],
          ["rejected", copy.filters.rejected],
        ]}
        value={filters.membershipStatus ?? ""}
      />
      <SelectFilter
        label={copy.filters.role}
        onChange={onRoleChange}
        options={[
          ["", copy.filters.all],
          ["user", copy.filters.user],
          ["admin", copy.filters.admin],
        ]}
        value={filters.role ?? ""}
      />
      <SelectFilter
        label={copy.filters.accountStatus}
        onChange={onAccountStatusChange}
        options={[
          ["", copy.filters.all],
          ["active", copy.filters.active],
          ["disabled", copy.filters.disabled],
        ]}
        value={filters.accountStatus ?? ""}
      />
    </div>
  );
}

function SelectFilter({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-stone-800">
      {label}
      <select
        className="rounded border border-stone-300 bg-white px-3 py-2.5 text-base font-normal text-stone-950 outline-none focus:border-emerald-700"
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue || "all"} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function AdminUserCard({
  copy,
  currentUserId,
  onAction,
  pendingAction,
  user,
}: {
  copy: AdminUsersCopy;
  currentUserId: string;
  onAction: (
    user: AdminUserSummary,
    action: AdminUserActionKind,
  ) => Promise<void>;
  pendingAction: string;
  user: AdminUserSummary;
}) {
  const actions = visibleAdminUserActions(user, currentUserId);

  return (
    <article className="rounded border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-stone-950">{user.username}</h2>
            {user.id === currentUserId ? (
              <Badge tone="stone">{copy.fields.currentAdmin}</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {copy.fields.email}: {user.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={user.emailVerified ? "emerald" : "amber"}>
            {user.emailVerified
              ? copy.fields.emailVerified
              : copy.fields.emailUnverified}
          </Badge>
          <Badge tone="stone">
            {copy.filters[user.membershipStatus]}
          </Badge>
          <Badge tone={user.role === "admin" ? "emerald" : "stone"}>
            {copy.filters[user.role]}
          </Badge>
          <Badge tone={user.accountStatus === "disabled" ? "red" : "emerald"}>
            {copy.filters[user.accountStatus]}
          </Badge>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-stone-700 md:grid-cols-2">
        <div>
          <dt className="font-semibold text-stone-950">{copy.fields.createdAt}</dt>
          <dd>{formatDate(user.createdAt)}</dd>
        </div>
        {user.disabledAt ? (
          <div>
            <dt className="font-semibold text-stone-950">
              {copy.fields.disabledAt}
            </dt>
            <dd>{formatDate(user.disabledAt)}</dd>
          </div>
        ) : null}
      </dl>

      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => {
            const pendingKey = `${user.id}:${action}`;
            return (
              <button
                className={`rounded px-3 py-2 text-sm font-semibold ${
                  action === "disable"
                    ? "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                    : "border border-stone-300 bg-white text-stone-950 hover:bg-stone-100"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                disabled={pendingAction === pendingKey}
                key={action}
                onClick={() => void onAction(user, action)}
                type="button"
              >
                {copy.actions[action]}
              </button>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "amber" | "emerald" | "red" | "stone";
}) {
  const className = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-red-200 bg-red-50 text-red-800",
    stone: "border-stone-200 bg-stone-50 text-stone-700",
  }[tone];

  return (
    <span
      className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function AdminNavLink({
  active = false,
  children,
  to,
}: {
  active?: boolean;
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

async function runAdminUserAction(
  userId: string,
  action: AdminUserActionKind,
) {
  if (action === "approve-membership") {
    return approveMembership(userId);
  }
  if (action === "reject-membership") {
    return rejectMembership(userId);
  }
  if (action === "restore-membership") {
    return restoreMembership(userId);
  }

  return disableUser(userId);
}

function formatDate(value: string) {
  return value.slice(0, 10);
}
