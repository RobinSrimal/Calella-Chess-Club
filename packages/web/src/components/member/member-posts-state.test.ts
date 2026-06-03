import { expect, test } from "vitest";
import { ca } from "../../i18n/ca";
import { en } from "../../i18n/en";
import type { MemberPost, PublicUser } from "../../lib/browser-api";
import {
  canUseMemberPosts,
  messageForPostErrorCode,
  postStatusLabel,
  visibleMemberPosts,
} from "./member-posts-state";

test("visibleMemberPosts hides deleted posts and sorts newest updated first", () => {
  expect(
    visibleMemberPosts([
      memberPost({
        id: "old-draft",
        status: "draft",
        updatedAt: "2026-06-01T10:00:00.000Z",
      }),
      memberPost({
        id: "deleted",
        status: "deleted",
        updatedAt: "2026-06-03T10:00:00.000Z",
        deletedAt: "2026-06-03T10:00:00.000Z",
      }),
      memberPost({
        id: "published",
        status: "published",
        updatedAt: "2026-06-02T10:00:00.000Z",
      }),
    ]).map((post) => post.id),
  ).toEqual(["published", "old-draft"]);
});

test("canUseMemberPosts allows members and admins only", () => {
  expect(canUseMemberPosts(user({ membershipStatus: "member" }))).toBe(true);
  expect(canUseMemberPosts(user({ role: "admin", membershipStatus: "pending" }))).toBe(true);
  expect(canUseMemberPosts(user({ membershipStatus: "pending" }))).toBe(false);
  expect(canUseMemberPosts(undefined)).toBe(false);
});

test("postStatusLabel uses localized status text", () => {
  expect(postStatusLabel(memberPost({ status: "draft" }), ca.member.posts)).toBe(
    "Esborrany",
  );
  expect(postStatusLabel(memberPost({ status: "published" }), en.member.posts)).toBe(
    "Published",
  );
});

test("messageForPostErrorCode returns stable English-only messages", () => {
  expect(messageForPostErrorCode("API_VALIDATION_FAILED")).toBe(
    "Check the post title and body.",
  );
  expect(messageForPostErrorCode("API_POST_NOT_FOUND")).toBe(
    "Could not find that post.",
  );
  expect(messageForPostErrorCode("UNKNOWN")).toBe("Could not complete the request.");
});

function memberPost(overrides: Partial<MemberPost> = {}): MemberPost {
  return {
    id: "post-1",
    authorId: "user-1",
    authorUsername: "anna",
    title: "Club night",
    bodyJson: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Body", styles: {} }],
        children: [],
      },
    ],
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

function user(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "user-1",
    username: "anna",
    email: "anna@example.com",
    emailVerified: true,
    membershipStatus: "pending",
    role: "user",
    ...overrides,
  };
}
