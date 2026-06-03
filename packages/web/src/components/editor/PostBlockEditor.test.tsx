import { expect, test } from "vitest";
import { postEditorSchema } from "./PostBlockEditor";

test("post editor schema only enables paragraph blocks and supported inline styles", () => {
  expect(Object.keys(postEditorSchema.blockSpecs).sort()).toEqual(["paragraph"]);
  expect(Object.keys(postEditorSchema.inlineContentSpecs).sort()).toEqual([
    "link",
    "text",
  ]);
  expect(Object.keys(postEditorSchema.styleSpecs).sort()).toEqual([
    "bold",
    "italic",
  ]);
});
