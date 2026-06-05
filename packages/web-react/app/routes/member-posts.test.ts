import { describe, expect, test } from "vitest";
import type { PublicUser } from "../lib/account-api";
import type { MemberPost } from "../lib/post-api";
import {
  loader,
  mergeChangedPost,
  removeDeletedPost,
  shouldPublishPublicly,
} from "./member-posts";

describe("member posts route", () => {
  test("loads localized Catalan member posts copy", async () => {
    const data = (await loader({
      params: {},
      request: new Request("https://club.example/ca/member/posts"),
    } as never)) as any;

    expect(data.locale).toBe("ca");
    expect(data.copy.title).toBe("Posts dels membres");
    expect(data.copy.newDraft).toBe("Nou esborrany");
    expect(data.copy.publishPublicly).toBe("Fer públic a la portada");
  });

  test("only admins can request public publishing", () => {
    const admin = user({ role: "admin", membershipStatus: "pending" });
    const member = user({ role: "user", membershipStatus: "member" });

    expect(shouldPublishPublicly(admin, true)).toBe(true);
    expect(shouldPublishPublicly(admin, false)).toBe(false);
    expect(shouldPublishPublicly(member, true)).toBe(false);
  });

  test("merges changed posts into the visible list and keeps drafts first", () => {
    const existingDraft = post({
      id: "draft-1",
      status: "draft",
      updatedAt: "2026-06-05T09:00:00.000Z",
    });
    const published = post({
      id: "published-1",
      status: "published",
      updatedAt: "2026-06-05T08:00:00.000Z",
      publishedAt: "2026-06-05T08:00:00.000Z",
    });
    const changedDraft = post({
      id: "draft-2",
      status: "draft",
      updatedAt: "2026-06-05T10:00:00.000Z",
    });

    const posts = mergeChangedPost([published, existingDraft], changedDraft);

    expect(posts.map((item) => item.id)).toEqual([
      "draft-2",
      "draft-1",
      "published-1",
    ]);
  });

  test("removes a deleted post from the visible list", () => {
    const deleted = post({ id: "post-1", status: "deleted" });
    const visible = post({ id: "post-2", status: "published" });

    expect(removeDeletedPost([deleted, visible], deleted).map((item) => item.id))
      .toEqual(["post-2"]);
  });
});

function user(overrides: Partial<PublicUser>): PublicUser {
  return {
    id: "user-1",
    username: "member",
    email: "member@example.com",
    emailVerified: true,
    membershipStatus: "member",
    role: "user",
    ...overrides,
  };
}

function post(overrides: Partial<MemberPost>): MemberPost {
  return {
    id: "post-1",
    authorId: "user-1",
    authorUsername: "member",
    title: "Title",
    bodyJson: [{ type: "paragraph", content: "Body", children: [] }],
    status: "draft",
    isPublic: false,
    publishedAt: null,
    createdAt: "2026-06-05T07:00:00.000Z",
    updatedAt: "2026-06-05T07:00:00.000Z",
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}
