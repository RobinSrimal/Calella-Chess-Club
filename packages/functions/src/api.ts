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
import {
  type Post,
  type PostRepository,
  createD1PostRepository,
} from "./posts/repository";
import { parsePostDraftBody, parsePostPublishBody } from "./posts/validation";

export type ApiHealthResponse = {
  service: "api";
  status: "ok";
};

export type ApiErrorCode =
  | "API_AUTH_INVALID"
  | "API_AUTH_REQUIRED"
  | "API_FORBIDDEN"
  | "API_POST_NOT_FOUND"
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

export type PostsResponse = {
  posts: Post[];
};

export type PostResponse = {
  post: Post;
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
  postRepository: Pick<
    PostRepository,
    | "listVisiblePosts"
    | "findVisiblePostById"
    | "createPostDraft"
    | "updateOwnPost"
    | "publishOwnDraft"
    | "updatePublicVisibility"
    | "softDeleteOwnPost"
    | "softDeletePublishedPost"
  >;
  jwtSigningSecret: string;
  now: () => Date;
  newId: () => string;
};

type JsonBody =
  | ApiHealthResponse
  | ApiErrorResponse
  | MeResponse
  | AdminUsersResponse
  | AdminUserResponse
  | PostsResponse
  | PostResponse;

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

  if (url.pathname === "/api/posts") {
    if (request.method === "GET") {
      return listPosts(request, context ?? createDefaultApiContext());
    }
    if (request.method === "POST") {
      return createPost(request, context ?? createDefaultApiContext());
    }
  }

  const postAction = parsePostAction(url.pathname, request.method);
  if (postAction) {
    return handlePostAction(
      request,
      postAction,
      context ?? createDefaultApiContext(),
    );
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

async function listPosts(
  request: Request,
  context: ApiContext,
): Promise<Response> {
  const current = await requireMemberOrAdmin(request, context);
  if (!current.ok) {
    return current.response;
  }

  return jsonResponse({
    posts: await context.postRepository.listVisiblePosts({
      userId: current.user.id,
    }),
  });
}

async function createPost(
  request: Request,
  context: ApiContext,
): Promise<Response> {
  const current = await requireMemberOrAdmin(request, context);
  if (!current.ok) {
    return current.response;
  }

  const json = await readJsonBody(request);
  if (!json.ok) {
    return errorResponse("API_VALIDATION_FAILED", 400, {
      fields: ["body"],
    });
  }

  const parsed = parsePostDraftBody(json.value);
  if (!parsed.ok) {
    return errorResponse("API_VALIDATION_FAILED", 400, {
      fields: parsed.fields,
    });
  }

  const nowIso = context.now().toISOString();
  const post = await context.postRepository.createPostDraft({
    id: context.newId(),
    authorId: current.user.id,
    title: parsed.value.title,
    bodyMarkdown: parsed.value.bodyMarkdown,
    createdAt: nowIso,
  });
  if (!post) {
    return errorResponse("API_POST_NOT_FOUND", 404);
  }

  return jsonResponse({ post }, { status: 201 });
}

async function handlePostAction(
  request: Request,
  action: PostAction,
  context: ApiContext,
): Promise<Response> {
  if (action.kind === "get") {
    return getPost(request, action.postId, context);
  }
  if (action.kind === "update") {
    return updatePost(request, action.postId, context);
  }
  if (action.kind === "publish") {
    return publishPost(request, action.postId, context);
  }
  if (action.kind === "public" || action.kind === "member-only") {
    return updatePostVisibility(request, action, context);
  }
  if (action.kind === "delete") {
    return deletePost(request, action.postId, context);
  }

  return errorResponse("API_ROUTE_NOT_FOUND", 404);
}

async function getPost(
  request: Request,
  postId: string,
  context: ApiContext,
): Promise<Response> {
  const current = await requireMemberOrAdmin(request, context);
  if (!current.ok) {
    return current.response;
  }

  const post = await context.postRepository.findVisiblePostById({
    postId,
    userId: current.user.id,
  });
  if (!post) {
    return errorResponse("API_POST_NOT_FOUND", 404);
  }

  return jsonResponse({ post });
}

async function updatePost(
  request: Request,
  postId: string,
  context: ApiContext,
): Promise<Response> {
  const current = await requireMemberOrAdmin(request, context);
  if (!current.ok) {
    return current.response;
  }

  const json = await readJsonBody(request);
  if (!json.ok) {
    return errorResponse("API_VALIDATION_FAILED", 400, {
      fields: ["body"],
    });
  }

  const parsed = parsePostDraftBody(json.value);
  if (!parsed.ok) {
    return errorResponse("API_VALIDATION_FAILED", 400, {
      fields: parsed.fields,
    });
  }

  const post = await context.postRepository.updateOwnPost({
    postId,
    authorId: current.user.id,
    title: parsed.value.title,
    bodyMarkdown: parsed.value.bodyMarkdown,
    updatedAt: context.now().toISOString(),
  });
  if (!post) {
    return errorResponse("API_POST_NOT_FOUND", 404);
  }

  return jsonResponse({ post });
}

async function publishPost(
  request: Request,
  postId: string,
  context: ApiContext,
): Promise<Response> {
  const current = await requireMemberOrAdmin(request, context);
  if (!current.ok) {
    return current.response;
  }

  const json = await readJsonBody(request);
  if (!json.ok) {
    return errorResponse("API_VALIDATION_FAILED", 400, {
      fields: ["body"],
    });
  }

  const parsed = parsePostPublishBody(json.value);
  if (!parsed.ok) {
    return errorResponse("API_VALIDATION_FAILED", 400, {
      fields: parsed.fields,
    });
  }

  if (parsed.value.makePublic && current.user.role !== "admin") {
    return errorResponse("API_FORBIDDEN", 403);
  }

  const nowIso = context.now().toISOString();
  const post = await context.postRepository.publishOwnDraft({
    postId,
    authorId: current.user.id,
    isPublic: parsed.value.makePublic,
    publishedAt: nowIso,
  });
  if (!post) {
    return errorResponse("API_POST_NOT_FOUND", 404);
  }

  return jsonResponse({ post });
}

async function updatePostVisibility(
  request: Request,
  action: PostVisibilityAction,
  context: ApiContext,
): Promise<Response> {
  const admin = await requireAdmin(request, context);
  if (!admin.ok) {
    return admin.response;
  }

  const post = await context.postRepository.updatePublicVisibility({
    postId: action.postId,
    isPublic: action.kind === "public",
    updatedAt: context.now().toISOString(),
  });
  if (!post) {
    return errorResponse("API_POST_NOT_FOUND", 404);
  }

  return jsonResponse({ post });
}

async function deletePost(
  request: Request,
  postId: string,
  context: ApiContext,
): Promise<Response> {
  const current = await requireMemberOrAdmin(request, context);
  if (!current.ok) {
    return current.response;
  }

  const nowIso = context.now().toISOString();
  const ownPost = await context.postRepository.softDeleteOwnPost({
    postId,
    userId: current.user.id,
    deletedAt: nowIso,
  });
  if (ownPost) {
    return jsonResponse({ post: ownPost });
  }

  if (current.user.role === "admin") {
    const adminDeleted = await context.postRepository.softDeletePublishedPost({
      postId,
      deletedBy: current.user.id,
      deletedAt: nowIso,
    });
    if (adminDeleted) {
      return jsonResponse({ post: adminDeleted });
    }
  }

  return errorResponse("API_POST_NOT_FOUND", 404);
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

async function requireMemberOrAdmin(
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
    user.accountStatus !== "active" ||
    !user.emailVerified ||
    !user.emailVerifiedAt ||
    (user.role !== "admin" && user.membershipStatus !== "member")
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

type PostReadWriteAction = {
  kind: "get" | "update" | "delete";
  postId: string;
};

type PostPublishAction = {
  kind: "publish";
  postId: string;
};

type PostVisibilityAction = {
  kind: "public" | "member-only";
  postId: string;
};

type PostAction = PostReadWriteAction | PostPublishAction | PostVisibilityAction;

function parsePostAction(
  pathname: string,
  method: string,
): PostAction | undefined {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 3 || segments[0] !== "api" || segments[1] !== "posts") {
    return undefined;
  }

  const postId = decodeURIComponent(segments[2] ?? "");
  if (!postId) {
    return undefined;
  }

  if (segments.length === 3) {
    if (method === "GET") {
      return { kind: "get", postId };
    }
    if (method === "PUT") {
      return { kind: "update", postId };
    }
    if (method === "DELETE") {
      return { kind: "delete", postId };
    }
  }

  if (segments.length === 4 && method === "POST") {
    if (segments[3] === "publish") {
      return { kind: "publish", postId };
    }
    if (segments[3] === "public") {
      return { kind: "public", postId };
    }
    if (segments[3] === "member-only") {
      return { kind: "member-only", postId };
    }
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

async function readJsonBody(
  request: Request,
): Promise<
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
    }
> {
  const text = await request.text();
  if (text.trim().length === 0) {
    return {
      ok: true,
      value: undefined,
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(text),
    };
  } catch {
    return {
      ok: false,
    };
  }
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
    postRepository: createD1PostRepository(Resource.Database),
    jwtSigningSecret: Resource.JwtSigningSecret.value,
    now: () => new Date(),
    newId: () => crypto.randomUUID(),
  };
}

export default {
  fetch(request: Request) {
    return handleApiRequest(request);
  },
};
