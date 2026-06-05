import { describe, expect, test } from "vitest";
import { postEditorSchema } from "./PostBlockEditor";

describe("PostBlockEditor schema", () => {
  test("restricts BlockNote to paragraph, text/link, and bold/italic", () => {
    expect(Object.keys(postEditorSchema.blockSchema)).toEqual(["paragraph"]);
    expect(Object.keys(postEditorSchema.inlineContentSchema)).toEqual([
      "text",
      "link",
    ]);
    expect(Object.keys(postEditorSchema.styleSchema)).toEqual(["bold", "italic"]);
  });
});
