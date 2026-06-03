import type { MemberPost, PublicUser } from "../../lib/browser-api";

const GENERIC_ERROR_MESSAGE = "Could not complete the request.";

const ENGLISH_ERROR_MESSAGES: Record<string, string> = {
  API_AUTH_REQUIRED: "Log in again.",
  API_AUTH_INVALID: "The session is not valid. Log in again.",
  API_FORBIDDEN: "You need member access to manage posts.",
  API_POST_NOT_FOUND: "Could not find that post.",
  API_VALIDATION_FAILED: "Check the post title and body.",
  WEB_REQUEST_FAILED: "Could not connect to the server.",
};

export type MemberPostStatusLabels = {
  draftStatus: string;
  publishedStatus: string;
};

export function visibleMemberPosts(posts: MemberPost[]): MemberPost[] {
  return posts
    .filter((post) => post.status !== "deleted")
    .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function canUseMemberPosts(user: PublicUser | undefined): boolean {
  return user?.role === "admin" || user?.membershipStatus === "member";
}

export function postStatusLabel(
  post: Pick<MemberPost, "status">,
  labels: MemberPostStatusLabels,
): string {
  return post.status === "published" ? labels.publishedStatus : labels.draftStatus;
}

export function messageForPostErrorCode(code: string): string {
  return ENGLISH_ERROR_MESSAGES[code] ?? GENERIC_ERROR_MESSAGE;
}
