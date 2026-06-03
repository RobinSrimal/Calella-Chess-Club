import type { Locale } from "./locale";
import {
  normalizePostEditorDocument,
  type PostBodyJson,
  type PostEditorDocument,
} from "./post-body";

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

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: number;
      code: string;
      fields: string[];
    };

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  locale: Locale;
};

export type LoginInput = {
  usernameOrEmail: string;
  password: string;
};

export type PostStatus = "draft" | "published" | "deleted";

export type MemberPost = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  bodyJson: PostBodyJson;
  status: PostStatus;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
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

export type PostDraftInput = {
  title: string;
  bodyJson: PostEditorDocument;
};

type FetchFn = typeof fetch;

export function registerUser(
  input: RegisterInput,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ user: PublicUser }>> {
  return postJson("/auth/register", input, fetchFn);
}

export function loginUser(
  input: LoginInput,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ user: PublicUser }>> {
  return postJson("/auth/login", input, fetchFn);
}

export function getCurrentUser(
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ user: PublicUser }>> {
  return requestJson("/api/me", { method: "GET" }, fetchFn);
}

export function listAdminUsers(
  filters: AdminUserFilters = {},
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ users: AdminUserSummary[] }>> {
  const searchParams = new URLSearchParams();
  if (filters.membershipStatus) {
    searchParams.set("membershipStatus", filters.membershipStatus);
  }
  if (filters.role) {
    searchParams.set("role", filters.role);
  }
  if (filters.accountStatus) {
    searchParams.set("accountStatus", filters.accountStatus);
  }

  const query = searchParams.toString();
  return requestJson(
    query ? `/api/admin/users?${query}` : "/api/admin/users",
    { method: "GET" },
    fetchFn,
  );
}

export function approveMembership(
  userId: string,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ user: AdminUserSummary }>> {
  return postJson(
    `/api/admin/users/${encodeURIComponent(userId)}/approve-membership`,
    {},
    fetchFn,
  );
}

export function rejectMembership(
  userId: string,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ user: AdminUserSummary }>> {
  return postJson(
    `/api/admin/users/${encodeURIComponent(userId)}/reject-membership`,
    {},
    fetchFn,
  );
}

export function restoreMembership(
  userId: string,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ user: AdminUserSummary }>> {
  return postJson(
    `/api/admin/users/${encodeURIComponent(userId)}/restore-membership`,
    {},
    fetchFn,
  );
}

export function disableUser(
  userId: string,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ user: AdminUserSummary }>> {
  return postJson(
    `/api/admin/users/${encodeURIComponent(userId)}/disable`,
    {},
    fetchFn,
  );
}

export function listPosts(
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ posts: MemberPost[] }>> {
  return requestJson("/api/posts", { method: "GET" }, fetchFn);
}

export function createPost(
  input: PostDraftInput,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ post: MemberPost }>> {
  return postJson("/api/posts", normalizePostDraftInput(input), fetchFn);
}

export function updatePost(
  postId: string,
  input: PostDraftInput,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ post: MemberPost }>> {
  return requestJson(
    `/api/posts/${encodeURIComponent(postId)}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(normalizePostDraftInput(input)),
    },
    fetchFn,
  );
}

export function publishPost(
  postId: string,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ post: MemberPost }>> {
  return postJson(
    `/api/posts/${encodeURIComponent(postId)}/publish`,
    { makePublic: false },
    fetchFn,
  );
}

export function deletePost(
  postId: string,
  fetchFn: FetchFn = fetch,
): Promise<ApiResult<{ post: MemberPost }>> {
  return requestJson(
    `/api/posts/${encodeURIComponent(postId)}`,
    {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: "{}",
    },
    fetchFn,
  );
}

function normalizePostDraftInput(input: PostDraftInput) {
  return {
    title: input.title,
    bodyJson: normalizePostEditorDocument(input.bodyJson),
  };
}

function postJson<TBody extends object, TResponse>(
  path: string,
  body: TBody,
  fetchFn: FetchFn,
): Promise<ApiResult<TResponse>> {
  return requestJson(
    path,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
    fetchFn,
  );
}

async function requestJson<TResponse>(
  path: string,
  init: RequestInit,
  fetchFn: FetchFn,
): Promise<ApiResult<TResponse>> {
  let response: Response;

  try {
    response = await fetchFn(path, {
      ...init,
      credentials: "same-origin",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: "WEB_REQUEST_FAILED",
      fields: [],
    };
  }

  const body = await readJson(response);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      code: readErrorCode(body),
      fields: readErrorFields(body),
    };
  }

  return {
    ok: true,
    data: body as TResponse,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function readErrorCode(body: unknown): string {
  if (!isRecord(body) || !isRecord(body.error)) {
    return "WEB_REQUEST_FAILED";
  }

  return typeof body.error.code === "string"
    ? body.error.code
    : "WEB_REQUEST_FAILED";
}

function readErrorFields(body: unknown): string[] {
  if (!isRecord(body) || !isRecord(body.error) || !Array.isArray(body.error.fields)) {
    return [];
  }

  return body.error.fields.filter((field): field is string => typeof field === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
