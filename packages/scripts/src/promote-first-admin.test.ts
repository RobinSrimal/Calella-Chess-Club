import { expect, test, vi } from "vitest";
import {
  createCloudflareD1FirstAdminPromotionRepository,
  promoteFirstAdmin,
  type FirstAdminPromotionRepository,
} from "./promote-first-admin";

test("promotes exactly one active verified user to admin", async () => {
  const repository = createRepository({
    user: {
      id: "user-1",
      username: "RobinSrimal",
      email: "robin@example.com",
      accountStatus: "active",
      emailVerifiedAt: "2026-06-03T08:00:00.000Z",
      role: "user",
    },
  });

  const result = await promoteFirstAdmin({
    usernameOrEmail: " Robin@example.COM ",
    repository,
    now: () => new Date("2026-06-04T08:00:00.000Z"),
  });

  expect(result).toEqual({
    ok: true,
    user: {
      id: "user-1",
      username: "RobinSrimal",
      email: "robin@example.com",
      role: "admin",
    },
  });
  expect(repository.findUserForFirstAdminPromotion).toHaveBeenCalledWith(
    "robin@example.com",
  );
  expect(repository.promoteUserToAdmin).toHaveBeenCalledWith({
    userId: "user-1",
    updatedAt: "2026-06-04T08:00:00.000Z",
  });
});

test("rejects missing, unverified, and disabled users with stable script errors", async () => {
  await expect(
    promoteFirstAdmin({
      usernameOrEmail: "missing",
      repository: createRepository({ user: null }),
      now: () => new Date("2026-06-04T08:00:00.000Z"),
    }),
  ).resolves.toEqual({
    ok: false,
    code: "SCRIPT_USER_NOT_FOUND",
  });

  await expect(
    promoteFirstAdmin({
      usernameOrEmail: "robin",
      repository: createRepository({
        user: {
          id: "user-1",
          username: "RobinSrimal",
          email: "robin@example.com",
          accountStatus: "active",
          emailVerifiedAt: null,
          role: "user",
        },
      }),
      now: () => new Date("2026-06-04T08:00:00.000Z"),
    }),
  ).resolves.toEqual({
    ok: false,
    code: "SCRIPT_USER_NOT_VERIFIED",
  });

  await expect(
    promoteFirstAdmin({
      usernameOrEmail: "robin",
      repository: createRepository({
        user: {
          id: "user-1",
          username: "RobinSrimal",
          email: "robin@example.com",
          accountStatus: "disabled",
          emailVerifiedAt: "2026-06-03T08:00:00.000Z",
          role: "user",
        },
      }),
      now: () => new Date("2026-06-04T08:00:00.000Z"),
    }),
  ).resolves.toEqual({
    ok: false,
    code: "SCRIPT_USER_DISABLED",
  });
});

test("queries Cloudflare D1 through the HTTP API for script runtimes", async () => {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fetchD1 = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: JSON.parse(String(init?.body)),
    });

    return new Response(
      JSON.stringify({
        success: true,
        result: [
          {
            success: true,
            results: [
              {
                id: "user-1",
                username: "RobinSrimal",
                email: "robin@example.com",
                accountStatus: "active",
                emailVerifiedAt: "2026-06-03T08:00:00.000Z",
                role: "user",
              },
            ],
          },
        ],
      }),
      { status: 200 },
    );
  });
  const repository = createCloudflareD1FirstAdminPromotionRepository({
    accountId: "account-id",
    databaseId: "database-id",
    apiToken: "api-token",
    fetch: fetchD1 as typeof fetch,
  });

  const user = await repository.findUserForFirstAdminPromotion("robinsrimal");

  expect(user?.id).toBe("user-1");
  expect(calls[0].url).toBe(
    "https://api.cloudflare.com/client/v4/accounts/account-id/d1/database/database-id/query",
  );
  expect(calls[0].body).toEqual({
    sql: expect.stringContaining("FROM users"),
    params: ["robinsrimal", "robinsrimal"],
  });
});

function createRepository(options: {
  user: Awaited<
    ReturnType<FirstAdminPromotionRepository["findUserForFirstAdminPromotion"]>
  >;
}): FirstAdminPromotionRepository {
  return {
    findUserForFirstAdminPromotion: vi.fn().mockResolvedValue(options.user),
    promoteUserToAdmin: vi.fn().mockResolvedValue({
      id: "user-1",
      username: "RobinSrimal",
      email: "robin@example.com",
      role: "admin",
    }),
  };
}
