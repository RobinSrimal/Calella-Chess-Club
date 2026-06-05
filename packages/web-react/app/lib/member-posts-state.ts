import type { PublicUser } from "./account-api";
import type { MemberPost } from "./post-api";

export function canUseMemberPosts(user: PublicUser | null) {
  return user?.role === "admin" || user?.membershipStatus === "member";
}

export function sortMemberPosts(posts: MemberPost[]) {
  return [...posts].sort((left, right) => {
    const leftRank = left.status === "draft" ? 0 : 1;
    const rightRank = right.status === "draft" ? 0 : 1;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return comparableDate(right).localeCompare(comparableDate(left));
  });
}

export function canEditPost(post: MemberPost, currentUser: PublicUser | null) {
  return Boolean(
    currentUser &&
      post.authorId === currentUser.id &&
      post.status !== "deleted",
  );
}

export function canDeletePost(post: MemberPost, currentUser: PublicUser | null) {
  return canEditPost(post, currentUser);
}

export function messageForPostErrorCode(code: string) {
  const messages: Record<string, string> = {
    API_AUTH_REQUIRED: "Log in before using member posts.",
    API_AUTH_INVALID: "Your session has expired. Log in again.",
    API_FORBIDDEN: "Only members and admins can use member posts.",
    API_POST_NOT_FOUND: "The selected post no longer exists.",
    API_VALIDATION_FAILED: "Check the title and post body.",
    NETWORK_ERROR: "Network error. Check your connection and try again.",
  };

  return messages[code] ?? "Unexpected post error.";
}

function comparableDate(post: MemberPost) {
  return post.status === "published"
    ? (post.publishedAt ?? post.updatedAt)
    : post.updatedAt;
}
