import { Resource } from "sst";
import { ACCESS_TOKEN_COOKIE, readCookie } from "./auth/cookies";
import { verifyAccessJwt } from "./auth/jwt";
import {
  type AdminUserFilters,
  type AdminUserSummary,
  type AuthRepository,
  type CurrentUserLookup,
  type MembershipStatus,
  type PublicUser,
  type UserRole,
  createD1AuthRepository,
} from "./auth/repository";

export type ApiHealthResponse = {
  service: "api";
  status: "ok";
};

export type ApiErrorCode =
  | "API_AUTH_INVALID"
  | "API_AUTH_REQUIRED"
  | "API_FORBIDDEN"
  | "API_USER_NOT_FOUND"
  | "API_VALIDATION_FAILED"
  | "API_ROUTE_NOT_FOUND";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    fields?: string[];
  };
};

export type MeResponse = {
  user: PublicUser;
};

export type AdminUsersResponse = {
  users: AdminUserSummary[];
};

export type AdminUserResponse = {
  user: AdminUserSummary;
};

export type ApiContext = {
  repository: Pick<
    AuthRepository,
    | "findPublicUserById"
    | "findCurrentUserById"
    | "listAdminUsers"
    | "updateMembershipStatus"
    | "disableUserAndRevokeSessions"
  >;
  jwtSigningSecret: string;
  now: () => Date;
};

type JsonBody =
  | ApiHealthResponse
  | ApiErrorResponse
  | MeResponse
  | AdminUsersResponse
  | AdminUserResponse;

const MEMBERSHIP_STATUSES = ["none", "pending", "member", "rejected"] as const;
const USER_ROLES = ["user", "admin"] as const;
const ACCOUNT_STATUSES = ["active", "disabled"] as const;

export async function handleApiRequest(
  request: Request,
  context?: ApiContext,
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    const body: ApiHealthResponse = {
      service: "api",
      status: "ok",
    };
    return jsonResponse(body);
  }

  if (request.method === "GET" && url.pathname === "/api/me") {
    return me(request, context ?? createDefaultApiContext());
  }

  if (request.method === "GET" && url.pathname === "/api/admin/users") {
    return listAdminUsers(request, url, context ?? createDefaultApiContext());
  }

  const adminUserAction = parseAdminUserAction(url.pathname);
  if (request.method === "POST" && adminUserAction) {
    return handleAdminUserAction(
      request,
      adminUserAction,
      context ?? createDefaultApiContext(),
    );
  }

  return errorResponse("API_ROUTE_NOT_FOUND", 404);
}

function jsonResponse(body: JsonBody, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

async function me(request: Request, context: ApiContext): Promise<Response> {
  const accessToken = readCookie(request, ACCESS_TOKEN_COOKIE);
  if (!accessToken) {
    return errorResponse("API_AUTH_REQUIRED", 401);
  }

  const verified = await verifyAccessJwt(accessToken, {
    secret: context.jwtSigningSecret,
    now: context.now(),
  });
  if (!verified.ok) {
    return errorResponse("API_AUTH_INVALID", 401);
  }

  const user = await context.repository.findPublicUserById(verified.userId);
  if (!user) {
    return errorResponse("API_AUTH_INVALID", 401);
  }

  return jsonResponse({
    user,
  });
}

async function listAdminUsers(
  request: Request,
  url: URL,
  context: ApiContext,
): Promise<Response> {
  const admin = await requireAdmin(request, context);
  if (!admin.ok) {
    return admin.response;
  }

  const filters = parseAdminUserFilters(url);
  if (!filters.ok) {
    return errorResponse("API_VALIDATION_FAILED", 400, {
      fields: filters.fields,
    });
  }

  return jsonResponse({
    users: await context.repository.listAdminUsers(filters.value),
  });
}

async function handleAdminUserAction(
  request: Request,
  action: AdminUserAction,
  context: ApiContext,
): Promise<Response> {
  const admin = await requireAdmin(request, context);
  if (!admin.ok) {
    return admin.response;
  }

  const nowIso = context.now().toISOString();
  const user =
    action.kind === "disable"
      ? await context.repository.disableUserAndRevokeSessions({
          userId: action.userId,
          disabledBy: admin.user.id,
          disabledAt: nowIso,
        })
      : await context.repository.updateMembershipStatus({
          userId: action.userId,
          membershipStatus: action.membershipStatus,
          updatedAt: nowIso,
        });

  if (!user) {
    return errorResponse("API_USER_NOT_FOUND", 404);
  }

  return jsonResponse({
    user,
  });
}

async function requireAdmin(
  request: Request,
  context: ApiContext,
): Promise<
  | {
      ok: true;
      user: CurrentUserLookup;
    }
  | {
      ok: false;
      response: Response;
    }
> {
  const accessToken = readCookie(request, ACCESS_TOKEN_COOKIE);
  if (!accessToken) {
    return {
      ok: false,
      response: errorResponse("API_AUTH_REQUIRED", 401),
    };
  }

  const verified = await verifyAccessJwt(accessToken, {
    secret: context.jwtSigningSecret,
    now: context.now(),
  });
  if (!verified.ok) {
    return {
      ok: false,
      response: errorResponse("API_AUTH_INVALID", 401),
    };
  }

  const user = await context.repository.findCurrentUserById(verified.userId);
  if (!user) {
    return {
      ok: false,
      response: errorResponse("API_AUTH_INVALID", 401),
    };
  }

  if (
    user.role !== "admin" ||
    user.accountStatus !== "active" ||
    !user.emailVerified ||
    !user.emailVerifiedAt
  ) {
    return {
      ok: false,
      response: errorResponse("API_FORBIDDEN", 403),
    };
  }

  return {
    ok: true,
    user,
  };
}

type AdminUserAction =
  | {
      kind: "membership";
      userId: string;
      membershipStatus: MembershipStatus;
    }
  | {
      kind: "disable";
      userId: string;
    };

function parseAdminUserAction(pathname: string): AdminUserAction | undefined {
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length !== 5 ||
    segments[0] !== "api" ||
    segments[1] !== "admin" ||
    segments[2] !== "users"
  ) {
    return undefined;
  }

  const userId = decodeURIComponent(segments[3] ?? "");
  if (!userId) {
    return undefined;
  }

  if (segments[4] === "approve-membership") {
    return {
      kind: "membership",
      userId,
      membershipStatus: "member",
    };
  }
  if (segments[4] === "reject-membership") {
    return {
      kind: "membership",
      userId,
      membershipStatus: "rejected",
    };
  }
  if (segments[4] === "restore-membership") {
    return {
      kind: "membership",
      userId,
      membershipStatus: "pending",
    };
  }
  if (segments[4] === "disable") {
    return {
      kind: "disable",
      userId,
    };
  }

  return undefined;
}

function parseAdminUserFilters(
  url: URL,
):
  | {
      ok: true;
      value: AdminUserFilters;
    }
  | {
      ok: false;
      fields: string[];
    } {
  const fields: string[] = [];
  const filters: AdminUserFilters = {};
  const membershipStatus = url.searchParams.get("membershipStatus");
  const role = url.searchParams.get("role");
  const accountStatus = url.searchParams.get("accountStatus");

  if (membershipStatus) {
    if (isMembershipStatus(membershipStatus)) {
      filters.membershipStatus = membershipStatus;
    } else {
      fields.push("membershipStatus");
    }
  }
  if (role) {
    if (isUserRole(role)) {
      filters.role = role;
    } else {
      fields.push("role");
    }
  }
  if (accountStatus) {
    if (isAccountStatus(accountStatus)) {
      filters.accountStatus = accountStatus;
    } else {
      fields.push("accountStatus");
    }
  }

  if (fields.length > 0) {
    return {
      ok: false,
      fields,
    };
  }

  return {
    ok: true,
    value: filters,
  };
}

function isMembershipStatus(value: string): value is MembershipStatus {
  return MEMBERSHIP_STATUSES.includes(value as MembershipStatus);
}

function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

function isAccountStatus(value: string): value is "active" | "disabled" {
  return ACCOUNT_STATUSES.includes(value as "active" | "disabled");
}

function errorResponse(
  code: ApiErrorCode,
  status: number,
  extra: Omit<ApiErrorResponse["error"], "code"> = {},
): Response {
  return jsonResponse(
    {
      error: {
        code,
        ...extra,
      },
    },
    { status },
  );
}

function createDefaultApiContext(): ApiContext {
  return {
    repository: createD1AuthRepository(Resource.Database),
    jwtSigningSecret: Resource.JwtSigningSecret.value,
    now: () => new Date(),
  };
}

export default {
  fetch(request: Request) {
    return handleApiRequest(request);
  },
};
