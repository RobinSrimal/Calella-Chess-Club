export type PostInlineText = {
  type: "text";
  text: string;
  styles: PostInlineStyles;
};

export type PostInlineStyles = {
  bold?: true;
  italic?: true;
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
  content: PostInlineContent[];
};

export type PostBodyJson = PostBodyBlock[];

export type ParsedPostBodyJson = {
  document: PostBodyJson;
  serialized: string;
  textLength: number;
};

export type PostBodyJsonResult =
  | {
      ok: true;
      value: ParsedPostBodyJson;
    }
  | {
      ok: false;
    };

const MAX_BLOCKS = 100;
const MAX_TEXT_LENGTH = 10_000;
const MAX_SERIALIZED_LENGTH = 20_000;
const MAX_LINK_HREF_LENGTH = 2_000;

export function parsePostBodyJson(value: unknown): PostBodyJsonResult {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_BLOCKS) {
    return { ok: false };
  }

  const document: PostBodyJson = [];
  let textLength = 0;
  let nonWhitespaceTextLength = 0;

  for (const block of value) {
    const parsedBlock = parseParagraphBlock(block);
    if (!parsedBlock.ok) {
      return { ok: false };
    }

    textLength += flattenedTextLength(parsedBlock.block.content);
    nonWhitespaceTextLength += flattenedTextLength(parsedBlock.block.content, {
      trim: true,
    });
    if (textLength > MAX_TEXT_LENGTH) {
      return { ok: false };
    }

    document.push(parsedBlock.block);
  }

  if (nonWhitespaceTextLength === 0) {
    return { ok: false };
  }

  const serialized = JSON.stringify(document);
  if (serialized.length > MAX_SERIALIZED_LENGTH) {
    return { ok: false };
  }

  return {
    ok: true,
    value: {
      document,
      serialized,
      textLength,
    },
  };
}

function parseParagraphBlock(
  value: unknown,
):
  | {
      ok: true;
      block: PostBodyBlock;
    }
  | {
      ok: false;
    } {
  if (!isRecord(value) || value.type !== "paragraph") {
    return { ok: false };
  }
  if ("children" in value) {
    return { ok: false };
  }

  const content = parseBlockContent(value.content);
  if (!content.ok) {
    return { ok: false };
  }

  const block = {} as PostBodyBlock;

  if (typeof value.id === "string" && value.id.length > 0) {
    block.id = value.id;
  } else if (value.id !== undefined) {
    return { ok: false };
  }

  block.type = "paragraph";

  if (value.props !== undefined) {
    const props = parseParagraphProps(value.props);
    if (!props.ok) {
      return { ok: false };
    }
    block.props = props.props;
  }

  block.content = content.content;

  return { ok: true, block };
}

function parseBlockContent(
  value: unknown,
):
  | {
      ok: true;
      content: PostInlineContent[];
    }
  | {
      ok: false;
    } {
  if (typeof value === "string") {
    return {
      ok: true,
      content: [{ type: "text", text: value, styles: {} }],
    };
  }

  if (value === undefined) {
    return { ok: true, content: [] };
  }

  if (!Array.isArray(value)) {
    return { ok: false };
  }

  const content: PostInlineContent[] = [];
  for (const inline of value) {
    const parsedInline = parseInlineContent(inline);
    if (!parsedInline.ok) {
      return { ok: false };
    }
    content.push(parsedInline.inline);
  }

  return { ok: true, content };
}

function parseInlineContent(
  value: unknown,
):
  | {
      ok: true;
      inline: PostInlineContent;
    }
  | {
      ok: false;
    } {
  if (!isRecord(value) || typeof value.type !== "string") {
    return { ok: false };
  }

  if (value.type === "text") {
    return parseTextInline(value);
  }

  if (value.type === "link") {
    return parseLinkInline(value);
  }

  return { ok: false };
}

function parseTextInline(
  value: Record<string, unknown>,
):
  | {
      ok: true;
      inline: PostInlineText;
    }
  | {
      ok: false;
    } {
  if (typeof value.text !== "string") {
    return { ok: false };
  }

  const styles = parseStyles(value.styles);
  if (!styles.ok) {
    return { ok: false };
  }

  return {
    ok: true,
    inline: {
      type: "text",
      text: value.text,
      styles: styles.styles,
    },
  };
}

function parseLinkInline(
  value: Record<string, unknown>,
):
  | {
      ok: true;
      inline: PostInlineLink;
    }
  | {
      ok: false;
    } {
  if (
    typeof value.href !== "string" ||
    value.href.length === 0 ||
    value.href.length > MAX_LINK_HREF_LENGTH ||
    !isSafeHref(value.href)
  ) {
    return { ok: false };
  }
  if (!Array.isArray(value.content) || value.content.length === 0) {
    return { ok: false };
  }

  const content: PostInlineText[] = [];
  for (const inline of value.content) {
    const textInline = parseTextInlineValue(inline);
    if (!textInline.ok) {
      return { ok: false };
    }
    content.push(textInline.inline);
  }

  return {
    ok: true,
    inline: {
      type: "link",
      href: value.href,
      content,
    },
  };
}

function parseTextInlineValue(
  value: unknown,
):
  | {
      ok: true;
      inline: PostInlineText;
    }
  | {
      ok: false;
    } {
  if (!isRecord(value) || value.type !== "text") {
    return { ok: false };
  }

  return parseTextInline(value);
}

function parseStyles(
  value: unknown,
):
  | {
      ok: true;
      styles: PostInlineStyles;
    }
  | {
      ok: false;
    } {
  if (value === undefined) {
    return { ok: true, styles: {} };
  }
  if (!isRecord(value)) {
    return { ok: false };
  }

  const styles: PostInlineStyles = {};
  for (const [key, enabled] of Object.entries(value)) {
    if (key !== "bold" && key !== "italic") {
      return { ok: false };
    }
    if (enabled !== true) {
      return { ok: false };
    }
    styles[key] = true;
  }

  return { ok: true, styles };
}

function parseParagraphProps(
  value: unknown,
):
  | {
      ok: true;
      props: PostParagraphProps;
    }
  | {
      ok: false;
    } {
  if (!isRecord(value)) {
    return { ok: false };
  }

  const expected: PostParagraphProps = {
    backgroundColor: "default",
    textColor: "default",
    textAlignment: "left",
  };

  if (
    value.backgroundColor !== expected.backgroundColor ||
    value.textColor !== expected.textColor ||
    value.textAlignment !== expected.textAlignment
  ) {
    return { ok: false };
  }

  for (const key of Object.keys(value)) {
    if (key !== "backgroundColor" && key !== "textColor" && key !== "textAlignment") {
      return { ok: false };
    }
  }

  return { ok: true, props: expected };
}

function flattenedTextLength(
  content: PostInlineContent[],
  options: { trim: boolean } = { trim: false },
): number {
  const lengthOf = (text: string) => (options.trim ? text.trim().length : text.length);

  return content.reduce((length, inline) => {
    if (inline.type === "text") {
      return length + lengthOf(inline.text);
    }

    return (
      length +
      inline.content.reduce((linkLength, text) => linkLength + lengthOf(text.text), 0)
    );
  }, 0);
}

function isSafeHref(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
