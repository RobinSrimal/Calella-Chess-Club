export type PostDraftBody = {
  title: string;
  bodyMarkdown: string;
};

export type PostDraftBodyResult =
  | {
      ok: true;
      value: PostDraftBody;
    }
  | {
      ok: false;
      fields: string[];
    };

export type PostPublishBody = {
  makePublic: boolean;
};

export type PostPublishBodyResult =
  | {
      ok: true;
      value: PostPublishBody;
    }
  | {
      ok: false;
      fields: string[];
    };

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_MARKDOWN_LENGTH = 10_000;

export function parsePostDraftBody(body: unknown): PostDraftBodyResult {
  if (!isRecord(body)) {
    return { ok: false, fields: ["body"] };
  }

  const fields: string[] = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bodyMarkdown =
    typeof body.bodyMarkdown === "string" ? body.bodyMarkdown.trim() : "";

  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    fields.push("title");
  }
  if (
    bodyMarkdown.length === 0 ||
    bodyMarkdown.length > MAX_BODY_MARKDOWN_LENGTH
  ) {
    fields.push("bodyMarkdown");
  }

  if (fields.length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      title,
      bodyMarkdown,
    },
  };
}

export function parsePostPublishBody(body: unknown): PostPublishBodyResult {
  if (body === undefined) {
    return { ok: true, value: { makePublic: false } };
  }

  if (!isRecord(body)) {
    return { ok: false, fields: ["body"] };
  }

  if (body.makePublic === undefined) {
    return { ok: true, value: { makePublic: false } };
  }

  if (typeof body.makePublic !== "boolean") {
    return { ok: false, fields: ["makePublic"] };
  }

  return { ok: true, value: { makePublic: body.makePublic } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
