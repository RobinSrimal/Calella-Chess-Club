import { describe, expect, test } from "vitest";
import {
  emptyPostBody,
  normalizePostEditorDocument,
  postBodyHasText,
  previewPostBodyText,
  type PostBodyJson,
} from "./post-body";

describe("post body helpers", () => {
  test("creates a single empty paragraph body", () => {
    expect(emptyPostBody()).toEqual([
      {
        type: "paragraph",
        props: {
          backgroundColor: "default",
          textColor: "default",
          textAlignment: "left",
        },
        content: "",
        children: [],
      },
    ]);
  });

  test("flattens paragraph text, styled text, and link text for previews", () => {
    const body: PostBodyJson = [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "First ", styles: {} },
          { type: "text", text: "bold", styles: { bold: true } },
          {
            type: "link",
            href: "https://club.example",
            content: [
              { type: "text", text: " link", styles: { italic: true } },
            ],
          },
        ],
        children: [],
      },
      {
        type: "paragraph",
        content: "Second paragraph",
        children: [],
      },
    ];

    expect(previewPostBodyText(body)).toBe("First bold link Second paragraph");
  });

  test("detects whether a body contains non-whitespace text", () => {
    expect(postBodyHasText(emptyPostBody())).toBe(false);
    expect(
      postBodyHasText([
        {
          type: "paragraph",
          content: [{ type: "text", text: "  text  ", styles: {} }],
          children: [],
        },
      ]),
    ).toBe(true);
  });

  test("normalizes supported paragraph blocks", () => {
    const body = normalizePostEditorDocument([
      {
        id: "block-1",
        type: "paragraph",
        props: {},
        content: [
          { type: "text", text: "Bold italic", styles: { bold: true, italic: true } },
          { type: "text", text: "Ignored style", styles: { underline: true } },
        ],
        children: [],
      },
    ]);

    expect(body).toEqual([
      {
        id: "block-1",
        type: "paragraph",
        props: {
          backgroundColor: "default",
          textColor: "default",
          textAlignment: "left",
        },
        content: [
          { type: "text", text: "Bold italic", styles: { bold: true, italic: true } },
          { type: "text", text: "Ignored style", styles: {} },
        ],
        children: [],
      },
    ]);
  });

  test("preserves unsupported blocks for backend validation", () => {
    const body = normalizePostEditorDocument([
      {
        type: "heading",
        content: "Not allowed",
        children: [],
      },
    ]);

    expect(body).toEqual([
      {
        type: "heading",
        content: "Not allowed",
        children: [],
      },
    ]);
  });

  test("preserves paragraph blocks with nested children for backend validation", () => {
    const body = normalizePostEditorDocument([
      {
        type: "paragraph",
        content: "Parent",
        children: [
          {
            type: "paragraph",
            content: "Nested child",
            children: [],
          },
        ],
      },
    ]);

    expect(body).toEqual([
      {
        type: "paragraph",
        content: "Parent",
        children: [
          {
            type: "paragraph",
            content: "Nested child",
            children: [],
          },
        ],
      },
    ]);
  });
});
