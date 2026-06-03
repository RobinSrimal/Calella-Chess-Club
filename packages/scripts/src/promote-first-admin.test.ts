import { expect, test, vi } from "vitest";
import {
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
