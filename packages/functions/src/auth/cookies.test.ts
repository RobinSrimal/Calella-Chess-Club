import { expect, test } from "vitest";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  createAccessTokenCookie,
  createRefreshTokenCookie,
  readCookie,
} from "./cookies";

test("serializes access and refresh cookies with explicit auth attributes", () => {
  expect(createAccessTokenCookie("access.jwt", { secure: true })).toBe(
    "ccc_access_token=access.jwt; Max-Age=7200; Path=/api; HttpOnly; SameSite=Lax; Secure",
  );
  expect(createRefreshTokenCookie("refresh-token", { secure: false })).toBe(
    "ccc_refresh_token=refresh-token; Max-Age=1209600; Path=/auth; HttpOnly; SameSite=Lax",
  );
});

test("clears access and refresh cookies on their scoped paths", () => {
  expect(clearAccessTokenCookie({ secure: true })).toBe(
    "ccc_access_token=; Max-Age=0; Path=/api; HttpOnly; SameSite=Lax; Secure",
  );
  expect(clearRefreshTokenCookie({ secure: false })).toBe(
    "ccc_refresh_token=; Max-Age=0; Path=/auth; HttpOnly; SameSite=Lax",
  );
});

test("reads named cookies from request headers", () => {
  const request = new Request("https://club.example/api/me", {
    headers: {
      cookie: `${ACCESS_TOKEN_COOKIE}=access.jwt; ${REFRESH_TOKEN_COOKIE}=refresh-token`,
    },
  });

  expect(readCookie(request, ACCESS_TOKEN_COOKIE)).toBe("access.jwt");
  expect(readCookie(request, REFRESH_TOKEN_COOKIE)).toBe("refresh-token");
  expect(readCookie(request, "missing")).toBeUndefined();
});
