import { expect, test } from "vitest";
import {
  emptyPostBody,
  normalizePostEditorDocument,
  postBodyHasText,
  previewPostBodyText,
} from "./post-body";

test("emptyPostBody creates one empty paragraph block", () => {
  expect(emptyPostBody()).toEqual([
    {
      type: "paragraph",
      props: {
        backgroundColor: "default",
        textColor: "default",
        textAlignment: "left",
      },
      content: [],
      children: [],
    },
  ]);
});

test("previewPostBodyText flattens supported inline text across paragraphs", () => {
  expect(
    previewPostBodyText([
      {
        type: "paragraph",
        content: [
          { type: "text", text: "First ", styles: {} },
          { type: "text", text: "bold", styles: { bold: true } },
          { type: "text", text: " and ", styles: { italic: true } },
          {
            type: "link",
            href: "https://example.com",
            content: [{ type: "text", text: "linked", styles: {} }],
          },
        ],
      },
      {
        type: "paragraph",
        content: "Second paragraph.",
      },
    ]),
  ).toBe("First bold and linked\n\nSecond paragraph.");
});

test("postBodyHasText ignores whitespace-only paragraphs", () => {
  expect(
    postBodyHasText([
      {
        type: "paragraph",
        content: [{ type: "text", text: "   ", styles: {} }],
      },
    ]),
  ).toBe(false);

  expect(
    postBodyHasText([
      {
        type: "paragraph",
        content: [
          {
            type: "link",
            href: "https://example.com",
            content: [{ type: "text", text: "Link text", styles: {} }],
          },
        ],
      },
    ]),
  ).toBe(true);
});

test("normalizePostEditorDocument preserves empty and non-empty editor children", () => {
  const bodyJson = [
    {
      id: "block-1",
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: "Parent", styles: {} }],
      children: [],
    },
    {
      id: "block-2",
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: "Nested parent", styles: {} }],
      children: [
        {
          type: "paragraph",
          content: "Nested child",
        },
      ],
    },
  ];

  expect(normalizePostEditorDocument(bodyJson)).toEqual(bodyJson);
});
