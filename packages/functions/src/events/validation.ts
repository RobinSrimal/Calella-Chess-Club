export type EventDraftBody = {
  title: string;
  descriptionMarkdown: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
};

export type EventDraftBodyResult =
  | {
      ok: true;
      value: EventDraftBody;
    }
  | {
      ok: false;
      fields: string[];
    };

export type EventPublishBody = {
  makePublic: boolean;
};

export type EventPublishBodyResult =
  | {
      ok: true;
      value: EventPublishBody;
    }
  | {
      ok: false;
      fields: string[];
    };

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_MARKDOWN_LENGTH = 10_000;
const MAX_LOCATION_LENGTH = 200;

export function parseEventDraftBody(body: unknown): EventDraftBodyResult {
  if (!isRecord(body)) {
    return { ok: false, fields: ["body"] };
  }

  const fields: string[] = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const descriptionMarkdown =
    typeof body.descriptionMarkdown === "string"
      ? body.descriptionMarkdown.trim()
      : "";
  const location =
    typeof body.location === "string" ? body.location.trim() : null;
  const startsAt = typeof body.startsAt === "string" ? body.startsAt.trim() : "";
  const endsAt = typeof body.endsAt === "string" ? body.endsAt.trim() : "";
  const startsAtTime = Date.parse(startsAt);
  const endsAtTime = Date.parse(endsAt);
  const hasValidStartsAt = isValidIsoDateTime(startsAt, startsAtTime);
  const hasValidEndsAt = isValidIsoDateTime(endsAt, endsAtTime);

  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    fields.push("title");
  }
  if (
    descriptionMarkdown.length === 0 ||
    descriptionMarkdown.length > MAX_DESCRIPTION_MARKDOWN_LENGTH
  ) {
    fields.push("descriptionMarkdown");
  }
  if (location !== null && location.length > MAX_LOCATION_LENGTH) {
    fields.push("location");
  }
  if (!hasValidStartsAt) {
    fields.push("startsAt");
  }
  if (!hasValidEndsAt || (hasValidStartsAt && endsAtTime <= startsAtTime)) {
    fields.push("endsAt");
  }

  if (fields.length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      title,
      descriptionMarkdown,
      location: location && location.length > 0 ? location : null,
      startsAt,
      endsAt,
    },
  };
}

export function parseEventPublishBody(body: unknown): EventPublishBodyResult {
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

function isValidIsoDateTime(value: string, time: number): boolean {
  if (!Number.isFinite(time)) {
    return false;
  }

  const normalized = new Date(time).toISOString();
  return normalized === value;
}
