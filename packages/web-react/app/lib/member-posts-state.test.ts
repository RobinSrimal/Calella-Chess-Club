import { describe, expect, test } from "vitest";
import type { PublicUser } from "./account-api";
import { emptyPostBody } from "./post-body";
import type { MemberPost } from "./post-api";
import {
  canDeletePost,
  canEditPost,
  canUseMemberPosts,
  messageForPostErrorCode,
  sortMemberPosts,
} from "./member-posts-state";

describe("member posts state helpers", () => {
  test("allows members and admins to use member posts", () => {
    expect(canUseMemberPosts(publicUser({ membershipStatus: "member" }))).toBe(
      true,
    );
    expect(
      canUseMemberPosts(publicUser({ role: "admin", membershipStatus: "none" })),
    ).toBe(true);
    expect(canUseMemberPosts(publicUser({ membershipStatus: "pending" }))).toBe(
      false,
    );
    expect(canUseMemberPosts(null)).toBe(false);
  });

  test("sorts drafts before published posts", () => {
    const posts = [
      memberPost({
        id: "published-old",
        status: "published",
        publishedAt: "2026-06-01T09:00:00.000Z",
        updatedAt: "2026-06-01T09:00:00.000Z",
      }),
      memberPost({
        id: "draft-new",
        status: "draft",
        updatedAt: "2026-06-03T09:00:00.000Z",
      }),
      memberPost({
        id: "draft-old",
        status: "draft",
        updatedAt: "2026-06-02T09:00:00.000Z",
      }),
      memberPost({
        id: "published-new",
        status: "published",
        publishedAt: "2026-06-04T09:00:00.000Z",
        updatedAt: "2026-06-04T09:00:00.000Z",
      }),
    ];

    expect(sortMemberPosts(posts).map((post) => post.id)).toEqual([
      "draft-new",
      "draft-old",
      "published-new",
      "published-old",
    ]);
  });

  test("allows editing and deleting only own non-deleted posts", () => {
    const currentUser = publicUser({ id: "user-1" });
    expect(canEditPost(memberPost({ authorId: "user-1" }), currentUser)).toBe(
      true,
    );
    expect(canDeletePost(memberPost({ authorId: "user-1" }), currentUser)).toBe(
      true,
    );
    expect(canEditPost(memberPost({ authorId: "other" }), currentUser)).toBe(
      false,
    );
    expect(canDeletePost(memberPost({ status: "deleted" }), currentUser)).toBe(
      false,
    );
  });

  test("maps stable post error codes to English messages", () => {
    expect(messageForPostErrorCode("API_AUTH_REQUIRED")).toBe(
      "Log in before using member posts.",
    );
    expect(messageForPostErrorCode("API_AUTH_INVALID")).toBe(
      "Your session has expired. Log in again.",
    );
    expect(messageForPostErrorCode("API_FORBIDDEN")).toBe(
      "Only members and admins can use member posts.",
    );
    expect(messageForPostErrorCode("API_POST_NOT_FOUND")).toBe(
      "The selected post no longer exists.",
    );
    expect(messageForPostErrorCode("API_VALIDATION_FAILED")).toBe(
      "Check the title and post body.",
    );
    expect(messageForPostErrorCode("NETWORK_ERROR")).toBe(
      "Network error. Check your connection and try again.",
    );
    expect(messageForPostErrorCode("OTHER")).toBe("Unexpected post error.");
  });
});

function publicUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "user-1",
    username: "User",
    email: "user@example.com",
    emailVerified: true,
    membershipStatus: "member",
    role: "user",
    ...overrides,
  };
}

function memberPost(overrides: Partial<MemberPost> = {}): MemberPost {
  return {
    id: "post-1",
    authorId: "user-1",
    authorUsername: "User",
    title: "Post",
    bodyJson: emptyPostBody(),
    status: "draft",
    isPublic: false,
    publishedAt: null,
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}
