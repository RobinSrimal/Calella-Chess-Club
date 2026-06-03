const PUBLIC_API_ORIGIN = "https://api.internal";

export type PublicPost = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  bodyJson: PostBodyJson;
  status: "published";
  isPublic: true;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
  deletedBy: null;
};

export type PostBodyJson = PostBodyBlock[];

export type PostBodyBlock = {
  type: "paragraph";
  content?: string | PostInlineContent[];
};

export type PostInlineText = {
  type: "text";
  text: string;
  styles?: Record<string, unknown>;
};

export type PostInlineLink = {
  type: "link";
  href: string;
  content: PostInlineText[];
};

export type PostInlineContent = PostInlineText | PostInlineLink;

export type PublicEvent = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  descriptionMarkdown: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  status: "published";
  isPublic: true;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
  deletedBy: null;
};

export type PublicLandingData = {
  posts: PublicPost[];
  events: PublicEvent[];
};

export type PublicApiBinding = {
  fetch(request: Request): Promise<Response>;
};

type JsonObject = Record<string, unknown>;

export async function getPublicLandingData(
  api: PublicApiBinding,
): Promise<PublicLandingData> {
  const [postsBody, eventsBody] = await Promise.all([
    fetchJson(api, "/api/public/posts"),
    fetchJson(api, "/api/public/events"),
  ]);

  return {
    posts: getArray<PublicPost>(postsBody, "posts"),
    events: getArray<PublicEvent>(eventsBody, "events"),
  };
}

async function fetchJson(
  api: PublicApiBinding,
  path: string,
): Promise<JsonObject | undefined> {
  try {
    const response = await api.fetch(
      new Request(`${PUBLIC_API_ORIGIN}${path}`, { method: "GET" }),
    );

    if (!response.ok) {
      return undefined;
    }

    const body: unknown = await response.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return undefined;
    }

    return body as JsonObject;
  } catch {
    return undefined;
  }
}

function getArray<T>(body: JsonObject | undefined, key: string): T[] {
  const value = body?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

export function previewPostBodyText(bodyJson: PostBodyJson): string {
  return bodyJson
    .map((block) => flattenBlockText(block))
    .filter((text) => text.length > 0)
    .join("\n\n");
}

function flattenBlockText(block: PostBodyBlock): string {
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
