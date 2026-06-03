import { expect, test } from "vitest";
import { verifyEmailToken } from "./email-verification";

test("does not call auth when the verification token is missing", async () => {
  let calls = 0;

  const result = await verifyEmailToken({
    token: null,
    auth: {
      async fetch() {
        calls += 1;
        return Response.json({});
      },
    },
  });

  expect(calls).toBe(0);
  expect(result).toEqual({ status: "missing-token" });
});

test("verifies an email token through the auth binding", async () => {
  const requestedUrls: string[] = [];

  const result = await verifyEmailToken({
    token: "raw-token",
    auth: {
      async fetch(request: Request) {
        requestedUrls.push(request.url);
        return Response.json({
          verified: true,
          membershipStatus: "pending",
        });
      },
    },
  });

  expect(new URL(requestedUrls[0]).pathname).toBe("/auth/verify-email");
  expect(new URL(requestedUrls[0]).searchParams.get("token")).toBe("raw-token");
  expect(result).toEqual({
    status: "verified",
    membershipStatus: "pending",
  });
});

test("returns the stable auth error code when verification fails", async () => {
  const result = await verifyEmailToken({
    token: "used-token",
    auth: {
      async fetch() {
        return Response.json(
          { error: { code: "AUTH_VERIFICATION_TOKEN_USED" } },
          { status: 409 },
        );
      },
    },
  });

  expect(result).toEqual({
    status: "error",
    code: "AUTH_VERIFICATION_TOKEN_USED",
    statusCode: 409,
  });
});

test("returns a fallback error when the auth binding is unavailable", async () => {
  const result = await verifyEmailToken({
    token: "raw-token",
    auth: {
      async fetch() {
        throw new Error("binding unavailable");
      },
    },
  });

  expect(result).toEqual({
    status: "error",
    code: "AUTH_VERIFICATION_FAILED",
    statusCode: 0,
  });
});
