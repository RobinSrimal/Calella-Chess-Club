import { expect, test } from "vitest";
import { parseEventDraftBody, parseEventPublishBody } from "./validation";

test("accepts and trims a valid event draft body", () => {
  const result = parseEventDraftBody({
    title: "  Club rapid night  ",
    descriptionMarkdown: "  **Round 1** starts at 19:00.  ",
    location: "  Calella Chess Club  ",
    startsAt: "2026-06-10T17:00:00.000Z",
    endsAt: "2026-06-10T19:00:00.000Z",
  });

  expect(result).toEqual({
    ok: true,
    value: {
      title: "Club rapid night",
      descriptionMarkdown: "**Round 1** starts at 19:00.",
      location: "Calella Chess Club",
      startsAt: "2026-06-10T17:00:00.000Z",
      endsAt: "2026-06-10T19:00:00.000Z",
    },
  });
});

test("normalizes empty event location to null", () => {
  const result = parseEventDraftBody({
    title: "Club rapid night",
    descriptionMarkdown: "**Round 1** starts at 19:00.",
    location: " ",
    startsAt: "2026-06-10T17:00:00.000Z",
    endsAt: "2026-06-10T19:00:00.000Z",
  });

  expect(result).toEqual({
    ok: true,
    value: {
      title: "Club rapid night",
      descriptionMarkdown: "**Round 1** starts at 19:00.",
      location: null,
      startsAt: "2026-06-10T17:00:00.000Z",
      endsAt: "2026-06-10T19:00:00.000Z",
    },
  });
});

test("rejects invalid event draft bodies with field errors", () => {
  const result = parseEventDraftBody({
    title: "x".repeat(121),
    descriptionMarkdown: "",
    location: "x".repeat(201),
    startsAt: "not-a-date",
    endsAt: "also-not-a-date",
  });

  expect(result).toEqual({
    ok: false,
    fields: ["title", "descriptionMarkdown", "location", "startsAt", "endsAt"],
  });
});

test("rejects events whose end is not after the start", () => {
  const result = parseEventDraftBody({
    title: "Club rapid night",
    descriptionMarkdown: "**Round 1** starts at 19:00.",
    startsAt: "2026-06-10T19:00:00.000Z",
    endsAt: "2026-06-10T19:00:00.000Z",
  });

  expect(result).toEqual({
    ok: false,
    fields: ["endsAt"],
  });
});

test("accepts optional event publish public visibility flag", () => {
  expect(parseEventPublishBody(undefined)).toEqual({
    ok: true,
    value: { makePublic: false },
  });

  expect(parseEventPublishBody({ makePublic: true })).toEqual({
    ok: true,
    value: { makePublic: true },
  });
});

test("rejects non-boolean event publish public visibility flag", () => {
  expect(parseEventPublishBody({ makePublic: "yes" })).toEqual({
    ok: false,
    fields: ["makePublic"],
  });
});
