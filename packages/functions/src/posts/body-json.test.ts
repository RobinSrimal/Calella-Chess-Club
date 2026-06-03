import { expect, test } from "vitest";
import { parsePostBodyJson } from "./body-json";

test("accepts paragraph blocks with text styles and links", () => {
  const result = parsePostBodyJson([
    {
      id: "block-1",
      type: "paragraph",
      props: {
        backgroundColor: "default",
        textColor: "default",
        textAlignment: "left",
      },
      content: [
        { type: "text", text: "Club ", styles: {} },
        { type: "text", text: "night", styles: { bold: true } },
        { type: "text", text: " at ", styles: { italic: true } },
        {
          type: "link",
          href: "https://example.com/rounds",
          content: [{ type: "text", text: "rounds", styles: {} }],
        },
      ],
    },
  ]);

  expect(result).toEqual({
    ok: true,
    value: {
      document: [
        {
          id: "block-1",
          type: "paragraph",
          props: {
            backgroundColor: "default",
            textColor: "default",
            textAlignment: "left",
          },
          content: [
            { type: "text", text: "Club ", styles: {} },
            { type: "text", text: "night", styles: { bold: true } },
            { type: "text", text: " at ", styles: { italic: true } },
            {
              type: "link",
              href: "https://example.com/rounds",
              content: [{ type: "text", text: "rounds", styles: {} }],
            },
          ],
        },
      ],
      serialized:
        '[{"id":"block-1","type":"paragraph","props":{"backgroundColor":"default","textColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"Club ","styles":{}},{"type":"text","text":"night","styles":{"bold":true}},{"type":"text","text":" at ","styles":{"italic":true}},{"type":"link","href":"https://example.com/rounds","content":[{"type":"text","text":"rounds","styles":{}}]}]}]',
      textLength: 20,
    },
  });
});

test("accepts string paragraph content and canonicalizes it", () => {
  const result = parsePostBodyJson([
    {
      type: "paragraph",
      content: "One paragraph.",
    },
  ]);

  expect(result).toEqual({
    ok: true,
    value: {
      document: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "One paragraph.", styles: {} }],
        },
      ],
      serialized:
        '[{"type":"paragraph","content":[{"type":"text","text":"One paragraph.","styles":{}}]}]',
      textLength: 14,
    },
  });
});

test("rejects empty and oversized documents", () => {
  expect(parsePostBodyJson([])).toEqual({ ok: false });
  expect(parsePostBodyJson([{ type: "paragraph", content: "   " }])).toEqual({
    ok: false,
  });
  expect(
    parsePostBodyJson(
      Array.from({ length: 101 }, () => ({
        type: "paragraph",
        content: "x",
      })),
    ),
  ).toEqual({ ok: false });
  expect(
    parsePostBodyJson([{ type: "paragraph", content: "x".repeat(10_001) }]),
  ).toEqual({ ok: false });
});

test("rejects unsupported block and inline shapes", () => {
  expect(parsePostBodyJson([{ type: "heading", content: "Title" }])).toEqual({
    ok: false,
  });
  expect(
    parsePostBodyJson([{ type: "image", props: { url: "https://example.com/a.png" } }]),
  ).toEqual({ ok: false });
  expect(
    parsePostBodyJson([
      {
        type: "paragraph",
        children: [{ type: "paragraph", content: "Nested" }],
        content: "Parent",
      },
    ]),
  ).toEqual({ ok: false });
  expect(
    parsePostBodyJson([
      {
        type: "paragraph",
        content: [{ type: "text", text: "Red", styles: { textColor: "red" } }],
      },
    ]),
  ).toEqual({ ok: false });
  expect(
    parsePostBodyJson([
      {
        type: "paragraph",
        content: [{ type: "link", href: "javascript:alert(1)", content: [] }],
      },
    ]),
  ).toEqual({ ok: false });
});

test("rejects non-array JSON and serialized oversized JSON", () => {
  expect(parsePostBodyJson({ type: "paragraph", content: "Nope" })).toEqual({
    ok: false,
  });
  expect(
    parsePostBodyJson([
      {
        type: "paragraph",
        props: { metadata: "x".repeat(20_000) },
        content: "Nope",
      },
    ]),
  ).toEqual({ ok: false });
});
