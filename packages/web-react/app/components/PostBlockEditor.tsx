import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
} from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  emptyPostBody,
  normalizePostEditorDocument,
  type PostBodyJson,
} from "../lib/post-body";

export const postEditorSchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
  },
  inlineContentSpecs: {
    text: defaultInlineContentSpecs.text,
    link: defaultInlineContentSpecs.link,
  },
  styleSpecs: {
    bold: defaultStyleSpecs.bold,
    italic: defaultStyleSpecs.italic,
  },
});

export function PostBlockEditor({
  bodyJson,
  onChange,
}: {
  bodyJson: PostBodyJson;
  onChange: (bodyJson: PostBodyJson) => void;
}) {
  const editor = useCreateBlockNote({
    schema: postEditorSchema,
    initialContent: normalizePostEditorDocument(
      bodyJson.length > 0 ? bodyJson : emptyPostBody(),
    ) as never,
  });

  return (
    <div className="rounded border border-stone-300 bg-white p-2 focus-within:border-emerald-700">
      <BlockNoteView
        editor={editor}
        onChange={() =>
          onChange(normalizePostEditorDocument(editor.document as unknown))
        }
        theme="light"
      />
    </div>
  );
}
