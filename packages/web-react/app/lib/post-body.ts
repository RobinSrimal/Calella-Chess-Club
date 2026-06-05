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
  content: string | PostInlineContent[];
  children?: [];
};

export type UnsupportedPostBodyBlock = Record<string, unknown>;

export type PostBodyJson = Array<PostBodyBlock | UnsupportedPostBodyBlock>;

const DEFAULT_PARAGRAPH_PROPS: PostParagraphProps = {
  backgroundColor: "default",
  textColor: "default",
  textAlignment: "left",
};

export function emptyPostBody(): PostBodyJson {
  return [
    {
      type: "paragraph",
      props: { ...DEFAULT_PARAGRAPH_PROPS },
      content: "",
      children: [],
    },
  ];
}

export function previewPostBodyText(bodyJson: PostBodyJson, maxLength = 180) {
  const text = bodyJson
    .map((block) => textFromBlock(block))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function postBodyHasText(bodyJson: PostBodyJson) {
  return previewPostBodyText(bodyJson, Number.MAX_SAFE_INTEGER).length > 0;
}

export function normalizePostEditorDocument(value: unknown): PostBodyJson {
  if (!Array.isArray(value)) {
    return emptyPostBody();
  }

  return value.map((block) => normalizeBlock(block));
}

function normalizeBlock(value: unknown): PostBodyBlock | UnsupportedPostBodyBlock {
  if (!isRecord(value) || value.type !== "paragraph") {
    return isRecord(value) ? { ...value } : { value };
  }

  if (Array.isArray(value.children) && value.children.length > 0) {
    return { ...value };
  }

  const block: PostBodyBlock = {
    type: "paragraph",
    props: normalizeParagraphProps(value.props),
    content: normalizeInlineContent(value.content),
    children: Array.isArray(value.children) && value.children.length === 0
      ? []
      : undefined,
  };

  if (typeof value.id === "string" && value.id.length > 0) {
    block.id = value.id;
  }

  return block;
}

function normalizeParagraphProps(value: unknown): PostParagraphProps {
  if (!isRecord(value)) {
    return { ...DEFAULT_PARAGRAPH_PROPS };
  }

  return {
    backgroundColor:
      value.backgroundColor === "default" ? "default" : "default",
    textColor: value.textColor === "default" ? "default" : "default",
    textAlignment: value.textAlignment === "left" ? "left" : "left",
  };
}

function normalizeInlineContent(value: unknown): string | PostInlineContent[] {
  if (typeof value === "string") {
    return value;
  }
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((inline) => normalizeInline(inline))
    .filter((inline): inline is PostInlineContent => inline !== undefined);
}

function normalizeInline(value: unknown): PostInlineContent | undefined {
  if (!isRecord(value) || typeof value.type !== "string") {
    return undefined;
  }

  if (value.type === "text") {
    return {
      type: "text",
      text: typeof value.text === "string" ? value.text : "",
      styles: normalizeStyles(value.styles),
    };
  }

  if (value.type === "link") {
    return {
      type: "link",
      href: typeof value.href === "string" ? value.href : "",
      content: Array.isArray(value.content)
        ? value.content
            .map((inline) => normalizeInline(inline))
            .filter(
              (inline): inline is PostInlineText => inline?.type === "text",
            )
        : [],
    };
  }

  return undefined;
}

function normalizeStyles(value: unknown): PostInlineStyles {
  if (!isRecord(value)) {
    return {};
  }

  return {
    ...(value.bold === true ? { bold: true as const } : {}),
    ...(value.italic === true ? { italic: true as const } : {}),
  };
}

function textFromBlock(block: PostBodyBlock | UnsupportedPostBodyBlock) {
  if (block.type !== "paragraph") {
    return "";
  }

  const content = block.content;
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }

  return content.map(textFromInline).join("");
}

function textFromInline(inline: unknown): string {
  if (!isRecord(inline) || typeof inline.type !== "string") {
    return "";
  }
  if (inline.type === "text") {
    return typeof inline.text === "string" ? inline.text : "";
  }
  if (inline.type === "link" && Array.isArray(inline.content)) {
    return inline.content.map(textFromInline).join("");
  }

  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
