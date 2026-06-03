import type { D1Database } from "@cloudflare/workers-types";

export type PostStatus = "draft" | "published" | "deleted";

export type Post = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  bodyMarkdown: string;
  status: PostStatus;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
};

export type CreatePostDraftInput = {
  id: string;
  authorId: string;
  title: string;
  bodyMarkdown: string;
  createdAt: string;
};

export type UpdateOwnPostInput = {
  postId: string;
  authorId: string;
  title: string;
  bodyMarkdown: string;
  updatedAt: string;
};

export type PublishOwnDraftInput = {
  postId: string;
  authorId: string;
  isPublic: boolean;
  publishedAt: string;
};

export type UpdatePublicVisibilityInput = {
  postId: string;
  isPublic: boolean;
  updatedAt: string;
};

export type SoftDeleteOwnPostInput = {
  postId: string;
  userId: string;
  deletedAt: string;
};

export type SoftDeletePublishedPostInput = {
  postId: string;
  deletedBy: string;
  deletedAt: string;
};

export type PostRepository = {
  listVisiblePosts(input: { userId: string }): Promise<Post[]>;
  findVisiblePostById(input: { postId: string; userId: string }): Promise<Post | null>;
  createPostDraft(input: CreatePostDraftInput): Promise<Post | null>;
  updateOwnPost(input: UpdateOwnPostInput): Promise<Post | null>;
  publishOwnDraft(input: PublishOwnDraftInput): Promise<Post | null>;
  updatePublicVisibility(input: UpdatePublicVisibilityInput): Promise<Post | null>;
  softDeleteOwnPost(input: SoftDeleteOwnPostInput): Promise<Post | null>;
  softDeletePublishedPost(input: SoftDeletePublishedPostInput): Promise<Post | null>;
};

type PostRow = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  bodyMarkdown: string;
  status: PostStatus;
  isPublic: number | boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
};

export function createD1PostRepository(database: D1Database): PostRepository {
  return {
    async listVisiblePosts(input) {
      const result = await database
        .prepare(
          [
            postSelect(),
            "FROM posts",
            "JOIN users ON users.id = posts.author_id",
            "WHERE posts.status = 'published'",
            "OR (posts.author_id = ? AND posts.status = 'draft')",
            "ORDER BY posts.updated_at DESC, posts.created_at DESC",
          ].join(" "),
        )
        .bind(input.userId)
        .all<PostRow>();

      return (result.results ?? []).map(mapPost);
    },

    async findVisiblePostById(input) {
      return findPost(
        database,
        [
          "posts.id = ?",
          "(posts.status = 'published' OR (posts.author_id = ? AND posts.status = 'draft'))",
        ],
        [input.postId, input.userId],
      );
    },

    async createPostDraft(input) {
      await database
        .prepare(
          [
            "INSERT INTO posts (",
            "id, author_id, title, body_markdown, status, is_public, published_at,",
            "created_at, updated_at, deleted_at, deleted_by",
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ].join(" "),
        )
        .bind(
          input.id,
          input.authorId,
          input.title,
          input.bodyMarkdown,
          "draft",
          0,
          null,
          input.createdAt,
          input.createdAt,
          null,
          null,
        )
        .run();

      return findPost(database, ["posts.id = ?"], [input.id]);
    },

    async updateOwnPost(input) {
      await database
        .prepare(
          [
            "UPDATE posts",
            "SET title = ?, body_markdown = ?, updated_at = ?",
            "WHERE id = ? AND author_id = ? AND status <> 'deleted'",
          ].join(" "),
        )
        .bind(
          input.title,
          input.bodyMarkdown,
          input.updatedAt,
          input.postId,
          input.authorId,
        )
        .run();

      return findPost(
        database,
        ["posts.id = ?", "posts.author_id = ?", "posts.status <> 'deleted'"],
        [input.postId, input.authorId],
      );
    },

    async publishOwnDraft(input) {
      await database
        .prepare(
          [
            "UPDATE posts",
            "SET status = 'published', is_public = ?, published_at = ?, updated_at = ?",
            "WHERE id = ? AND author_id = ? AND status = 'draft'",
          ].join(" "),
        )
        .bind(
          input.isPublic ? 1 : 0,
          input.publishedAt,
          input.publishedAt,
          input.postId,
          input.authorId,
        )
        .run();

      return findPost(
        database,
        [
          "posts.id = ?",
          "posts.author_id = ?",
          "posts.status = 'published'",
          "posts.published_at = ?",
        ],
        [input.postId, input.authorId, input.publishedAt],
      );
    },

    async updatePublicVisibility(input) {
      await database
        .prepare(
          [
            "UPDATE posts",
            "SET is_public = ?, updated_at = ?",
            "WHERE id = ? AND status = 'published'",
          ].join(" "),
        )
        .bind(input.isPublic ? 1 : 0, input.updatedAt, input.postId)
        .run();

      return findPost(
        database,
        ["posts.id = ?", "posts.status = 'published'"],
        [input.postId],
      );
    },

    async softDeleteOwnPost(input) {
      await database
        .prepare(
          [
            "UPDATE posts",
            "SET status = 'deleted', deleted_at = ?, deleted_by = ?, updated_at = ?",
            "WHERE id = ? AND author_id = ? AND status <> 'deleted'",
          ].join(" "),
        )
        .bind(
          input.deletedAt,
          input.userId,
          input.deletedAt,
          input.postId,
          input.userId,
        )
        .run();

      return findPost(
        database,
        [
          "posts.id = ?",
          "posts.author_id = ?",
          "posts.status = 'deleted'",
          "posts.deleted_at = ?",
          "posts.deleted_by = ?",
        ],
        [input.postId, input.userId, input.deletedAt, input.userId],
      );
    },

    async softDeletePublishedPost(input) {
      await database
        .prepare(
          [
            "UPDATE posts",
            "SET status = 'deleted', deleted_at = ?, deleted_by = ?, updated_at = ?",
            "WHERE id = ? AND status = 'published'",
          ].join(" "),
        )
        .bind(
          input.deletedAt,
          input.deletedBy,
          input.deletedAt,
          input.postId,
        )
        .run();

      return findPost(
        database,
        [
          "posts.id = ?",
          "posts.status = 'deleted'",
          "posts.deleted_at = ?",
          "posts.deleted_by = ?",
        ],
        [input.postId, input.deletedAt, input.deletedBy],
      );
    },
  };
}

async function findPost(
  database: D1Database,
  where: string[],
  params: unknown[],
): Promise<Post | null> {
  const row = await database
    .prepare(
      [
        postSelect(),
        "FROM posts",
        "JOIN users ON users.id = posts.author_id",
        `WHERE ${where.join(" AND ")}`,
      ].join(" "),
    )
    .bind(...params)
    .first<PostRow>();

  return row ? mapPost(row) : null;
}

function postSelect(): string {
  return [
    "SELECT",
    "posts.id, posts.author_id as authorId, users.username as authorUsername,",
    "posts.title, posts.body_markdown as bodyMarkdown, posts.status,",
    "posts.is_public as isPublic, posts.published_at as publishedAt,",
    "posts.created_at as createdAt, posts.updated_at as updatedAt,",
    "posts.deleted_at as deletedAt, posts.deleted_by as deletedBy",
  ].join(" ");
}

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    authorId: row.authorId,
    authorUsername: row.authorUsername,
    title: row.title,
    bodyMarkdown: row.bodyMarkdown,
    status: row.status,
    isPublic: row.isPublic === 1 || row.isPublic === true,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    deletedBy: row.deletedBy,
  };
}
