import { fetchJson, type ApiResult } from "./api-result";
import type { PostBodyJson } from "./post-body";

export type PublicPost = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  bodyJson: PostBodyJson;
  status: "published";
  isPublic: true;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
  deletedBy: null;
};

export type { ApiResult };

export function listPublicPosts(): Promise<ApiResult<{ posts: PublicPost[] }>> {
  return fetchJson("/api/public/posts", {
    credentials: "same-origin",
  });
}
