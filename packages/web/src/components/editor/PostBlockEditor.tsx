import {
  BlockNoteSchema,
  createParagraphBlockSpec,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
} from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import {
  BasicTextStyleButton,
  CreateLinkButton,
  FormattingToolbar,
  FormattingToolbarController,
  useCreateBlockNote,
} from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import type { PostBodyJson, PostEditorDocument } from "../../lib/post-body";

const { underline, strike, code, textColor, backgroundColor, ...postStyleSpecs } =
  defaultStyleSpecs;

export const postEditorSchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: createParagraphBlockSpec(),
  },
  inlineContentSpecs: defaultInlineContentSpecs,
  styleSpecs: postStyleSpecs,
});

type PostBlockEditorProps = {
  initialContent: PostBodyJson;
  editable?: boolean;
  onChange: (document: PostEditorDocument) => void;
};

export function PostBlockEditor({
  initialContent,
  editable = true,
  onChange,
}: PostBlockEditorProps) {
  const editor = useCreateBlockNote(
    {
      schema: postEditorSchema,
      initialContent,
    },
    [],
  );

  return (
    <div className="post-block-editor">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme="light"
        formattingToolbar={false}
        slashMenu={false}
        sideMenu={false}
        filePanel={false}
        tableHandles={false}
        emojiPicker={false}
        comments={false}
        onChange={() => onChange(editor.document as PostEditorDocument)}
      >
        <FormattingToolbarController formattingToolbar={PostFormattingToolbar} />
      </BlockNoteView>
    </div>
  );
}

function PostFormattingToolbar() {
  return (
    <FormattingToolbar>
      <BasicTextStyleButton basicTextStyle="bold" />
      <BasicTextStyleButton basicTextStyle="italic" />
      <CreateLinkButton />
    </FormattingToolbar>
  );
}
