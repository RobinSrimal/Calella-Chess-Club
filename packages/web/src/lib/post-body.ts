export type PostInlineStyles = {
  bold?: true;
  italic?: true;
};

export type PostInlineText = {
  type: "text";
  text: string;
  styles: PostInlineStyles;
};

export type PostInlineLink = {
  type: "link";
  href: string;
  content: PostInlineText[];
};

export type PostInlineContent = PostInlineText | PostInlineLink;

export type PostParagraphProps = {
  backgroundColor: "default";
  textColor: "default";
  textAlignment: "left";
};

export type PostBodyBlock = {
  id?: string;
  type: "paragraph";
  props?: PostParagraphProps;
  content?: string | PostInlineContent[];
  children?: [];
};

export type PostBodyJson = PostBodyBlock[];

export type PostEditorBlock = Omit<PostBodyBlock, "children"> & {
  children?: unknown[];
};

export type PostEditorDocument = PostEditorBlock[];

const DEFAULT_PARAGRAPH_PROPS: PostParagraphProps = {
  backgroundColor: "default",
  textColor: "default",
  textAlignment: "left",
};

export function emptyPostBody(): PostBodyJson {
  return [
    {
      type: "paragraph",
      props: DEFAULT_PARAGRAPH_PROPS,
      content: [],
      children: [],
    },
  ];
}

export function normalizePostEditorDocument(
  bodyJson: PostEditorDocument,
): PostEditorDocument {
  return bodyJson.map((block) => ({
    ...block,
    children: block.children ? [...block.children] : block.children,
  }));
}

export function postBodyHasText(bodyJson: PostEditorDocument): boolean {
  return previewPostBodyText(bodyJson).trim().length > 0;
}

export function previewPostBodyText(bodyJson: PostEditorDocument): string {
  return bodyJson
    .map((block) => flattenBlockText(block))
    .filter((text) => text.length > 0)
    .join("\n\n");
}

function flattenBlockText(block: PostEditorBlock): string {
  if (typeof block.content === "string") {
    return block.content.trim();
  }

  if (!Array.isArray(block.content)) {
    return "";
  }

  return block.content
    .map((inline) => {
      if (inline.type === "text") {
        return inline.text;
      }

      return inline.content.map((text) => text.text).join("");
    })
    .join("")
    .trim();
}
