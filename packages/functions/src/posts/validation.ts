import {
  parsePostBodyJson,
  type PostBodyJson,
} from "./body-json";

export type PostDraftBody = {
  title: string;
  bodyJson: PostBodyJson;
  bodyJsonSerialized: string;
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

export function parsePostDraftBody(body: unknown): PostDraftBodyResult {
  if (!isRecord(body)) {
    return { ok: false, fields: ["body"] };
  }

  const fields: string[] = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bodyJson = parsePostBodyJson(body.bodyJson);

  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    fields.push("title");
  }
  if (!bodyJson.ok) {
    fields.push("bodyJson");
  }

  if (fields.length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      title,
      bodyJson: bodyJson.value.document,
      bodyJsonSerialized: bodyJson.value.serialized,
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
