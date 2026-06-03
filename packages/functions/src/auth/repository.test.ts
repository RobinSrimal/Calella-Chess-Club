import type { D1Database } from "@cloudflare/workers-types";
import { expect, test, vi } from "vitest";
import { createD1AuthRepository } from "./repository";

test("inserts replacement refresh sessions before linking the current session", async () => {
  const batches: Array<Array<{ sql: string; params: unknown[] }>> = [];
  const database = createRecordingD1Database(batches);
  const repository = createD1AuthRepository(database);

  await repository.rotateRefreshSession({
    currentSessionId: "current-session",
    revokedAt: "2026-06-03T08:00:00.000Z",
    replacement: {
      id: "replacement-session",
      userId: "user-1",
      tokenHash: "token-hash",
      createdAt: "2026-06-03T08:00:00.000Z",
      expiresAt: "2026-06-17T08:00:00.000Z",
      revokedAt: null,
      replacedBy: null,
      userAgent: "Vitest",
    },
  });

  expect(batches[0]).toHaveLength(2);
  expect(batches[0][0].sql).toContain("INSERT INTO refresh_sessions");
  expect(batches[0][1].sql).toContain("UPDATE refresh_sessions");
});

function createRecordingD1Database(
  batches: Array<Array<{ sql: string; params: unknown[] }>>,
): D1Database {
  return {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          return {
            sql,
            params,
            first: vi.fn(),
            run: vi.fn(),
          };
        },
      };
    },
    batch(statements: Array<{ sql: string; params: unknown[] }>) {
      batches.push(statements);
      return Promise.resolve([]);
    },
  } as unknown as D1Database;
}
