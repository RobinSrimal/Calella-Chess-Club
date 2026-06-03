const PUBLIC_API_ORIGIN = "https://api.internal";

export type PublicPost = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  bodyMarkdown: string;
  status: "published";
  isPublic: true;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
  deletedBy: null;
};

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
