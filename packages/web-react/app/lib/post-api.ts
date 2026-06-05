import { fetchJson, type ApiResult } from "./api-result";
import type { PostBodyJson } from "./post-body";

export type { ApiResult };

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

export type PostDraftInput = {
  title: string;
  bodyJson: PostBodyJson;
};

export function listPosts(): Promise<ApiResult<{ posts: MemberPost[] }>> {
  return fetchJson("/api/posts", {
    credentials: "same-origin",
  });
}

export function createPost(
  input: PostDraftInput,
): Promise<ApiResult<{ post: MemberPost }>> {
  return fetchJson("/api/posts", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updatePost(
  id: string,
  input: PostDraftInput,
): Promise<ApiResult<{ post: MemberPost }>> {
  return fetchJson(`/api/posts/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function publishPost(
  id: string,
  input: { makePublic?: boolean } = {},
): Promise<ApiResult<{ post: MemberPost }>> {
  return fetchJson(`/api/posts/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ makePublic: input.makePublic === true }),
  });
}

export function deletePost(id: string): Promise<ApiResult<{ post: MemberPost }>> {
  return fetchJson(`/api/posts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
}
