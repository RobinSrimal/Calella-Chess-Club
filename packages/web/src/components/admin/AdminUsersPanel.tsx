import { useEffect, useMemo, useState } from "react";
import {
  approveMembership,
  disableUser,
  getCurrentUser,
  listAdminUsers,
  rejectMembership,
  restoreMembership,
  type AccountStatus,
  type AdminUserFilters,
  type AdminUserSummary,
  type MembershipStatus,
  type UserRole,
} from "../../lib/browser-api";
import type { Locale } from "../../lib/locale";
import {
  adminUserActions,
  canUseAdminUsers,
  messageForAdminUserErrorCode,
  sortedAdminUsers,
} from "./admin-users-state";

type AdminUsersLabels = {
  loading: string;
  empty: string;
  filters: string;
  membershipFilter: string;
  roleFilter: string;
  accountFilter: string;
  allMembershipStatuses: string;
  allRoles: string;
  allAccountStatuses: string;
  username: string;
  email: string;
  emailVerified: string;
  emailUnverified: string;
  membershipStatus: string;
  role: string;
  accountStatus: string;
  createdAt: string;
  actions: string;
  approve: string;
  approving: string;
  reject: string;
  rejecting: string;
  restore: string;
  restoring: string;
  disable: string;
  disabling: string;
  membershipNone: string;
  membershipPending: string;
  membershipMember: string;
  membershipRejected: string;
  roleUser: string;
  roleAdmin: string;
  accountActive: string;
  accountDisabled: string;
  currentAdmin: string;
  approvedSuccess: string;
  rejectedSuccess: string;
  restoredSuccess: string;
  disabledSuccess: string;
  loginRequired: string;
  forbidden: string;
  retry: string;
};

type AdminUsersPanelProps = {
  locale: Locale;
  labels: AdminUsersLabels;
};

type AccessState = "loading" | "login-required" | "forbidden" | "ready";
type ActionKind = "approve" | "reject" | "restore" | "disable";
type FilterValue<T extends string> = T | "all";

type FilterState = {
  membershipStatus: FilterValue<MembershipStatus>;
  role: FilterValue<UserRole>;
  accountStatus: FilterValue<AccountStatus>;
};

const DEFAULT_FILTERS: FilterState = {
  membershipStatus: "all",
  role: "all",
  accountStatus: "all",
};

export function AdminUsersPanel({ locale, labels }: AdminUsersPanelProps) {
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [currentAdminId, setCurrentAdminId] = useState<string>();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let isMounted = true;

    async function loadAccess() {
      const result = await getCurrentUser();
      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setAccessState("login-required");
        if (result.status !== 401) {
          setError(messageForAdminUserErrorCode(result.code));
        }
        return;
      }

      if (!canUseAdminUsers(result.data.user)) {
        setAccessState("forbidden");
        return;
      }

      setCurrentAdminId(result.data.user.id);
      setAccessState("ready");
    }

    loadAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (accessState !== "ready") {
      return;
    }

    let isMounted = true;

    async function loadUsers() {
      setIsLoadingUsers(true);
      setError(undefined);
      const result = await listAdminUsers(toAdminUserFilters(filters));
      if (!isMounted) {
        return;
      }

      setIsLoadingUsers(false);

      if (!result.ok) {
        if (result.status === 401) {
          setAccessState("login-required");
          return;
        }
        if (result.status === 403) {
          setAccessState("forbidden");
          return;
        }
        setError(messageForAdminUserErrorCode(result.code));
        return;
      }

      setUsers(sortedAdminUsers(result.data.users));
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [accessState, filters]);

  const visibleUsers = useMemo(() => sortedAdminUsers(users), [users]);

  async function runAction(user: AdminUserSummary, action: ActionKind) {
    if (!currentAdminId || pendingAction) {
      return;
    }

    setPendingAction(`${action}:${user.id}`);
    setMessage(undefined);
    setError(undefined);

    const result =
      action === "approve"
        ? await approveMembership(user.id)
        : action === "reject"
          ? await rejectMembership(user.id)
          : action === "restore"
            ? await restoreMembership(user.id)
            : await disableUser(user.id);

    setPendingAction(undefined);

    if (!result.ok) {
      setError(messageForAdminUserErrorCode(result.code));
      return;
    }

    setUsers((current) =>
      sortedAdminUsers([
        result.data.user,
        ...current.filter((existing) => existing.id !== result.data.user.id),
      ]),
    );
    setMessage(successMessageForAction(action, labels));
  }

  function updateFilter<T extends keyof FilterState>(key: T, value: FilterState[T]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  if (accessState === "loading") {
    return (
      <section className="admin-users-panel panel" aria-live="polite">
        <p>{labels.loading}</p>
      </section>
    );
  }

  if (accessState === "login-required") {
    return (
      <section className="admin-users-panel panel">
        <p>{labels.loginRequired}</p>
        <a className="button-link" href={`/${locale}/login`}>
          {labels.loginRequired}
        </a>
        {error ? (
          <p className="form-message error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  if (accessState === "forbidden") {
    return (
      <section className="admin-users-panel panel">
        <p>{labels.forbidden}</p>
      </section>
    );
  }

  return (
    <section className="admin-users-panel">
      <div className="admin-users-filters panel" aria-label={labels.filters}>
        <label>
          {labels.membershipFilter}
          <select
            value={filters.membershipStatus}
            onChange={(event) =>
              updateFilter(
                "membershipStatus",
                event.currentTarget.value as FilterState["membershipStatus"],
              )
            }
          >
            <option value="all">{labels.allMembershipStatuses}</option>
            <option value="none">{labels.membershipNone}</option>
            <option value="pending">{labels.membershipPending}</option>
            <option value="member">{labels.membershipMember}</option>
            <option value="rejected">{labels.membershipRejected}</option>
          </select>
        </label>
        <label>
          {labels.roleFilter}
          <select
            value={filters.role}
            onChange={(event) =>
              updateFilter("role", event.currentTarget.value as FilterState["role"])
            }
          >
            <option value="all">{labels.allRoles}</option>
            <option value="user">{labels.roleUser}</option>
            <option value="admin">{labels.roleAdmin}</option>
          </select>
        </label>
        <label>
          {labels.accountFilter}
          <select
            value={filters.accountStatus}
            onChange={(event) =>
              updateFilter(
                "accountStatus",
                event.currentTarget.value as FilterState["accountStatus"],
              )
            }
          >
            <option value="all">{labels.allAccountStatuses}</option>
            <option value="active">{labels.accountActive}</option>
            <option value="disabled">{labels.accountDisabled}</option>
          </select>
        </label>
      </div>

      {message ? (
        <p className="form-message success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="admin-users-table-wrap panel" aria-live="polite">
        {isLoadingUsers ? <p>{labels.loading}</p> : null}
        {!isLoadingUsers && visibleUsers.length === 0 ? <p>{labels.empty}</p> : null}
        {visibleUsers.length > 0 ? (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th scope="col">{labels.username}</th>
                <th scope="col">{labels.email}</th>
                <th scope="col">{labels.membershipStatus}</th>
                <th scope="col">{labels.role}</th>
                <th scope="col">{labels.accountStatus}</th>
                <th scope="col">{labels.createdAt}</th>
                <th scope="col">{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <AdminUserRow
                  key={user.id}
                  user={user}
                  currentAdminId={currentAdminId}
                  labels={labels}
                  locale={locale}
                  pendingAction={pendingAction}
                  onAction={runAction}
                />
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}

type AdminUserRowProps = {
  user: AdminUserSummary;
  currentAdminId: string | undefined;
  labels: AdminUsersLabels;
  locale: Locale;
  pendingAction: string | undefined;
  onAction: (user: AdminUserSummary, action: ActionKind) => void;
};

function AdminUserRow({
  user,
  currentAdminId,
  labels,
  locale,
  pendingAction,
  onAction,
}: AdminUserRowProps) {
  const actions = adminUserActions(user, currentAdminId ?? "");
  const hasPendingAction = pendingAction !== undefined;
  const isCurrentAdmin = currentAdminId === user.id;

  return (
    <tr>
      <td data-label={labels.username}>
        <strong>{user.username}</strong>
        {isCurrentAdmin ? <span className="admin-user-note">{labels.currentAdmin}</span> : null}
      </td>
      <td data-label={labels.email}>
        <span className="admin-user-email">{user.email}</span>
        <span className="admin-user-note">
          {user.emailVerified ? labels.emailVerified : labels.emailUnverified}
        </span>
      </td>
      <td data-label={labels.membershipStatus}>
        <span className={`status-pill membership-${user.membershipStatus}`}>
          {membershipStatusLabel(user.membershipStatus, labels)}
        </span>
      </td>
      <td data-label={labels.role}>
        <span className={`status-pill role-${user.role}`}>
          {roleLabel(user.role, labels)}
        </span>
      </td>
      <td data-label={labels.accountStatus}>
        <span className={`status-pill account-${user.accountStatus}`}>
          {accountStatusLabel(user.accountStatus, labels)}
        </span>
      </td>
      <td data-label={labels.createdAt}>{formatDate(user.createdAt, locale)}</td>
      <td data-label={labels.actions}>
        <div className="admin-users-actions">
          {actions.canApprove ? (
            <button
              className="button-link compact"
              type="button"
              disabled={hasPendingAction}
              onClick={() => onAction(user, "approve")}
            >
              {pendingAction === `approve:${user.id}` ? labels.approving : labels.approve}
            </button>
          ) : null}
          {actions.canReject ? (
            <button
              className="button-link compact danger"
              type="button"
              disabled={hasPendingAction}
              onClick={() => onAction(user, "reject")}
            >
              {pendingAction === `reject:${user.id}` ? labels.rejecting : labels.reject}
            </button>
          ) : null}
          {actions.canRestore ? (
            <button
              className="button-link compact"
              type="button"
              disabled={hasPendingAction}
              onClick={() => onAction(user, "restore")}
            >
              {pendingAction === `restore:${user.id}` ? labels.restoring : labels.restore}
            </button>
          ) : null}
          {actions.canDisable ? (
            <button
              className="button-link compact danger"
              type="button"
              disabled={hasPendingAction}
              onClick={() => onAction(user, "disable")}
            >
              {pendingAction === `disable:${user.id}` ? labels.disabling : labels.disable}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function toAdminUserFilters(filters: FilterState): AdminUserFilters {
  return {
    membershipStatus:
      filters.membershipStatus === "all" ? undefined : filters.membershipStatus,
    role: filters.role === "all" ? undefined : filters.role,
    accountStatus: filters.accountStatus === "all" ? undefined : filters.accountStatus,
  };
}

function successMessageForAction(action: ActionKind, labels: AdminUsersLabels): string {
  if (action === "approve") {
    return labels.approvedSuccess;
  }
  if (action === "reject") {
    return labels.rejectedSuccess;
  }
  if (action === "restore") {
    return labels.restoredSuccess;
  }
  return labels.disabledSuccess;
}

function membershipStatusLabel(
  status: MembershipStatus,
  labels: AdminUsersLabels,
): string {
  if (status === "none") {
    return labels.membershipNone;
  }
  if (status === "pending") {
    return labels.membershipPending;
  }
  if (status === "member") {
    return labels.membershipMember;
  }
  return labels.membershipRejected;
}

function roleLabel(role: UserRole, labels: AdminUsersLabels): string {
  return role === "admin" ? labels.roleAdmin : labels.roleUser;
}

function accountStatusLabel(
  status: AccountStatus,
  labels: AdminUsersLabels,
): string {
  return status === "disabled" ? labels.accountDisabled : labels.accountActive;
}

function formatDate(value: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
