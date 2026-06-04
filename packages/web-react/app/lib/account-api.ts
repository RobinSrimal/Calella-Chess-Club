export type MembershipStatus = "none" | "pending" | "member" | "rejected";
export type UserRole = "user" | "admin";
export type AccountStatus = "active" | "disabled";

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  membershipStatus: MembershipStatus;
  role: UserRole;
};

export type AdminUserSummary = PublicUser & {
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  disabledBy: string | null;
};

export type AdminUserFilters = {
  membershipStatus?: MembershipStatus;
  role?: UserRole;
  accountStatus?: AccountStatus;
};

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; code: string; fields?: string[]; status: number };

type VerifyEmailResponse = {
  verified: true;
  membershipStatus: "pending";
};

type AdminUserAction =
  | "approve-membership"
  | "reject-membership"
  | "restore-membership"
  | "disable";

export async function verifyEmailToken(
  token: string,
): Promise<ApiResult<VerifyEmailResponse>> {
  const params = new URLSearchParams({ token });

  return fetchJson(`/auth/verify-email?${params.toString()}`, {
    credentials: "same-origin",
  });
}

export async function getCurrentUser(): Promise<
  ApiResult<{ user: PublicUser }>
> {
  return fetchJson("/api/me", {
    credentials: "same-origin",
  });
}

export async function listAdminUsers(
  filters: AdminUserFilters = {},
): Promise<ApiResult<{ users: AdminUserSummary[] }>> {
  const params = new URLSearchParams();
  if (filters.membershipStatus) {
    params.set("membershipStatus", filters.membershipStatus);
  }
  if (filters.role) {
    params.set("role", filters.role);
  }
  if (filters.accountStatus) {
    params.set("accountStatus", filters.accountStatus);
  }

  const query = params.toString();

  return fetchJson(`/api/admin/users${query ? `?${query}` : ""}`, {
    credentials: "same-origin",
  });
}

export async function approveMembership(userId: string) {
  return postAdminUserAction(userId, "approve-membership");
}

export async function rejectMembership(userId: string) {
  return postAdminUserAction(userId, "reject-membership");
}

export async function restoreMembership(userId: string) {
  return postAdminUserAction(userId, "restore-membership");
}

export async function disableUser(userId: string) {
  return postAdminUserAction(userId, "disable");
}

async function postAdminUserAction(userId: string, action: AdminUserAction) {
  const encodedUserId = encodeURIComponent(userId);

  return fetchJson<{ user: AdminUserSummary }>(
    `/api/admin/users/${encodedUserId}/${action}`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    },
  );
}

async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    return readJsonResult<T>(await fetch(input, init));
  } catch {
    return { ok: false, code: "NETWORK_ERROR", status: 0 };
  }
}

async function readJsonResult<T>(response: Response): Promise<ApiResult<T>> {
  const body = await response.json().catch(() => undefined);

  if (response.ok) {
    return { ok: true, data: body as T, status: response.status };
  }

  const error =
    body &&
    typeof body === "object" &&
    "error" in body &&
    body.error &&
    typeof body.error === "object"
      ? (body.error as { code?: unknown; fields?: unknown })
      : undefined;

  return {
    ok: false,
    code: typeof error?.code === "string" ? error.code : "UNKNOWN_ERROR",
    fields: Array.isArray(error?.fields)
      ? error.fields.filter((field): field is string => typeof field === "string")
      : undefined,
    status: response.status,
  };
}
