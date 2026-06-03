import { expect, test } from "vitest";
import { parsePostDraftBody, parsePostPublishBody } from "./validation";

test("accepts and trims a valid post draft body", () => {
  const result = parsePostDraftBody({
    title: "  Club night results  ",
    bodyMarkdown: "  **Round 1** starts at 19:00.  ",
  });

  expect(result).toEqual({
    ok: true,
    value: {
      title: "Club night results",
      bodyMarkdown: "**Round 1** starts at 19:00.",
    },
  });
});

test("rejects invalid post draft bodies with field errors", () => {
  const result = parsePostDraftBody({
    title: "x".repeat(121),
    bodyMarkdown: "",
  });

  expect(result).toEqual({
    ok: false,
    fields: ["title", "bodyMarkdown"],
  });
});

test("rejects oversized post markdown bodies", () => {
  const result = parsePostDraftBody({
    title: "Club night results",
    bodyMarkdown: "x".repeat(10_001),
  });

  expect(result).toEqual({
    ok: false,
    fields: ["bodyMarkdown"],
  });
});

test("accepts optional publish public visibility flag", () => {
  expect(parsePostPublishBody(undefined)).toEqual({
    ok: true,
    value: { makePublic: false },
  });

  expect(parsePostPublishBody({ makePublic: true })).toEqual({
    ok: true,
    value: { makePublic: true },
  });
});

test("rejects non-boolean publish public visibility flag", () => {
  expect(parsePostPublishBody({ makePublic: "yes" })).toEqual({
    ok: false,
    fields: ["makePublic"],
  });
});
