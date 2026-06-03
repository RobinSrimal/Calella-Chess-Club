import type { D1Database } from "@cloudflare/workers-types";

export type EventStatus = "draft" | "published" | "deleted";

export type ClubEvent = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  descriptionMarkdown: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
};

export type CreateEventDraftInput = {
  id: string;
  authorId: string;
  title: string;
  descriptionMarkdown: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type UpdateOwnEventInput = {
  eventId: string;
  authorId: string;
  title: string;
  descriptionMarkdown: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  updatedAt: string;
};

export type PublishOwnEventDraftInput = {
  eventId: string;
  authorId: string;
  isPublic: boolean;
  publishedAt: string;
};

export type UpdateEventPublicVisibilityInput = {
  eventId: string;
  isPublic: boolean;
  updatedAt: string;
};

export type SoftDeleteOwnEventInput = {
  eventId: string;
  userId: string;
  deletedAt: string;
};

export type SoftDeletePublishedEventInput = {
  eventId: string;
  deletedBy: string;
  deletedAt: string;
};

export type EventRepository = {
  listVisibleEvents(input: { userId: string }): Promise<ClubEvent[]>;
  listPublicEvents(input: {
    limit: number;
    nowIso: string;
  }): Promise<ClubEvent[]>;
  findVisibleEventById(input: {
    eventId: string;
    userId: string;
  }): Promise<ClubEvent | null>;
  createEventDraft(input: CreateEventDraftInput): Promise<ClubEvent | null>;
  updateOwnEvent(input: UpdateOwnEventInput): Promise<ClubEvent | null>;
  publishOwnDraft(input: PublishOwnEventDraftInput): Promise<ClubEvent | null>;
  updatePublicVisibility(
    input: UpdateEventPublicVisibilityInput,
  ): Promise<ClubEvent | null>;
  softDeleteOwnEvent(input: SoftDeleteOwnEventInput): Promise<ClubEvent | null>;
  softDeletePublishedEvent(
    input: SoftDeletePublishedEventInput,
  ): Promise<ClubEvent | null>;
};

type EventRow = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  descriptionMarkdown: string;
  location: string | null;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  isPublic: number | boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
};

export function createD1EventRepository(database: D1Database): EventRepository {
  return {
    async listVisibleEvents(input) {
      const result = await database
        .prepare(
          [
            eventSelect(),
            "FROM events",
            "JOIN users ON users.id = events.author_id",
            "WHERE events.status = 'published'",
            "OR (events.author_id = ? AND events.status = 'draft')",
            "ORDER BY events.starts_at ASC, events.created_at ASC",
          ].join(" "),
        )
        .bind(input.userId)
        .all<EventRow>();

      return (result.results ?? []).map(mapEvent);
    },

    async listPublicEvents(input) {
      const result = await database
        .prepare(
          [
            eventSelect(),
            "FROM events",
            "JOIN users ON users.id = events.author_id",
            "WHERE events.status = 'published'",
            "AND events.is_public = 1",
            "AND events.starts_at >= ?",
            "ORDER BY events.starts_at ASC, events.created_at ASC",
            "LIMIT ?",
          ].join(" "),
        )
        .bind(input.nowIso, input.limit)
        .all<EventRow>();

      return (result.results ?? []).map(mapEvent);
    },

    async findVisibleEventById(input) {
      return findEvent(
        database,
        [
          "events.id = ?",
          "(events.status = 'published' OR (events.author_id = ? AND events.status = 'draft'))",
        ],
        [input.eventId, input.userId],
      );
    },

    async createEventDraft(input) {
      await database
        .prepare(
          [
            "INSERT INTO events (",
            "id, author_id, title, description_markdown, location, starts_at, ends_at,",
            "status, is_public, published_at, created_at, updated_at, deleted_at, deleted_by",
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ].join(" "),
        )
        .bind(
          input.id,
          input.authorId,
          input.title,
          input.descriptionMarkdown,
          input.location,
          input.startsAt,
          input.endsAt,
          "draft",
          0,
          null,
          input.createdAt,
          input.createdAt,
          null,
          null,
        )
        .run();

      return findEvent(database, ["events.id = ?"], [input.id]);
    },

    async updateOwnEvent(input) {
      await database
        .prepare(
          [
            "UPDATE events",
            "SET title = ?, description_markdown = ?, location = ?, starts_at = ?, ends_at = ?, updated_at = ?",
            "WHERE id = ? AND author_id = ? AND status <> 'deleted'",
          ].join(" "),
        )
        .bind(
          input.title,
          input.descriptionMarkdown,
          input.location,
          input.startsAt,
          input.endsAt,
          input.updatedAt,
          input.eventId,
          input.authorId,
        )
        .run();

      return findEvent(
        database,
        ["events.id = ?", "events.author_id = ?", "events.status <> 'deleted'"],
        [input.eventId, input.authorId],
      );
    },

    async publishOwnDraft(input) {
      await database
        .prepare(
          [
            "UPDATE events",
            "SET status = 'published', is_public = ?, published_at = ?, updated_at = ?",
            "WHERE id = ? AND author_id = ? AND status = 'draft'",
          ].join(" "),
        )
        .bind(
          input.isPublic ? 1 : 0,
          input.publishedAt,
          input.publishedAt,
          input.eventId,
          input.authorId,
        )
        .run();

      return findEvent(
        database,
        [
          "events.id = ?",
          "events.author_id = ?",
          "events.status = 'published'",
          "events.published_at = ?",
        ],
        [input.eventId, input.authorId, input.publishedAt],
      );
    },

    async updatePublicVisibility(input) {
      await database
        .prepare(
          [
            "UPDATE events",
            "SET is_public = ?, updated_at = ?",
            "WHERE id = ? AND status = 'published'",
          ].join(" "),
        )
        .bind(input.isPublic ? 1 : 0, input.updatedAt, input.eventId)
        .run();

      return findEvent(
        database,
        ["events.id = ?", "events.status = 'published'"],
        [input.eventId],
      );
    },

    async softDeleteOwnEvent(input) {
      await database
        .prepare(
          [
            "UPDATE events",
            "SET status = 'deleted', deleted_at = ?, deleted_by = ?, updated_at = ?",
            "WHERE id = ? AND author_id = ? AND status <> 'deleted'",
          ].join(" "),
        )
        .bind(
          input.deletedAt,
          input.userId,
          input.deletedAt,
          input.eventId,
          input.userId,
        )
        .run();

      return findEvent(
        database,
        [
          "events.id = ?",
          "events.author_id = ?",
          "events.status = 'deleted'",
          "events.deleted_at = ?",
          "events.deleted_by = ?",
        ],
        [input.eventId, input.userId, input.deletedAt, input.userId],
      );
    },

    async softDeletePublishedEvent(input) {
      await database
        .prepare(
          [
            "UPDATE events",
            "SET status = 'deleted', deleted_at = ?, deleted_by = ?, updated_at = ?",
            "WHERE id = ? AND status = 'published'",
          ].join(" "),
        )
        .bind(
          input.deletedAt,
          input.deletedBy,
          input.deletedAt,
          input.eventId,
        )
        .run();

      return findEvent(
        database,
        [
          "events.id = ?",
          "events.status = 'deleted'",
          "events.deleted_at = ?",
          "events.deleted_by = ?",
        ],
        [input.eventId, input.deletedAt, input.deletedBy],
      );
    },
  };
}

async function findEvent(
  database: D1Database,
  where: string[],
  params: unknown[],
): Promise<ClubEvent | null> {
  const row = await database
    .prepare(
      [
        eventSelect(),
        "FROM events",
        "JOIN users ON users.id = events.author_id",
        `WHERE ${where.join(" AND ")}`,
      ].join(" "),
    )
    .bind(...params)
    .first<EventRow>();

  return row ? mapEvent(row) : null;
}

function eventSelect(): string {
  return [
    "SELECT",
    "events.id, events.author_id as authorId, users.username as authorUsername,",
    "events.title, events.description_markdown as descriptionMarkdown,",
    "events.location, events.starts_at as startsAt, events.ends_at as endsAt,",
    "events.status, events.is_public as isPublic, events.published_at as publishedAt,",
    "events.created_at as createdAt, events.updated_at as updatedAt,",
    "events.deleted_at as deletedAt, events.deleted_by as deletedBy",
  ].join(" ");
}

function mapEvent(row: EventRow): ClubEvent {
  return {
    id: row.id,
    authorId: row.authorId,
    authorUsername: row.authorUsername,
    title: row.title,
    descriptionMarkdown: row.descriptionMarkdown,
    location: row.location,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status,
    isPublic: row.isPublic === 1 || row.isPublic === true,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    deletedBy: row.deletedBy,
  };
}
