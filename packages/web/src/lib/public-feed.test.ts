import { expect, test } from "vitest";
import { getPublicLandingData } from "./public-feed";

test("fetches landing posts and events through the API binding", async () => {
  const requestedPaths: string[] = [];
  const post = {
    id: "post-1",
    authorId: "author-1",
    authorUsername: "anna",
    title: "Open tournament",
    bodyJson: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Registration is ", styles: {} },
          { type: "text", text: "open", styles: { bold: true } },
          {
            type: "link",
            href: "https://example.com",
            content: [{ type: "text", text: " now", styles: {} }],
          },
        ],
      },
    ],
    status: "published",
    isPublic: true,
    publishedAt: "2026-06-01T10:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    deletedAt: null,
    deletedBy: null,
  };
  const event = {
    id: "event-1",
    authorId: "author-1",
    authorUsername: "anna",
    title: "Friday blitz",
    descriptionMarkdown: "Casual games at the club.",
    location: "Club room",
    startsAt: "2026-06-12T18:00:00.000Z",
    endsAt: "2026-06-12T20:00:00.000Z",
    status: "published",
    isPublic: true,
    publishedAt: "2026-06-01T10:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    deletedAt: null,
    deletedBy: null,
  };

  const data = await getPublicLandingData({
    async fetch(request: Request) {
      const path = new URL(request.url).pathname;
      requestedPaths.push(path);

      if (path === "/api/public/posts") {
        return Response.json({ posts: [post] });
      }

      return Response.json({ events: [event] });
    },
  });

  expect(requestedPaths).toEqual(["/api/public/posts", "/api/public/events"]);
  expect(data.posts).toEqual([post]);
  expect(data.events).toEqual([event]);
});

test("returns empty landing lists when the API binding is unavailable", async () => {
  const data = await getPublicLandingData({
    async fetch(request: Request) {
      const path = new URL(request.url).pathname;

      if (path === "/api/public/posts") {
        return new Response("unavailable", { status: 503 });
      }

      throw new Error("network unavailable");
    },
  });

  expect(data).toEqual({ posts: [], events: [] });
});
