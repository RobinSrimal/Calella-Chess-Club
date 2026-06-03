export const ACCESS_TOKEN_COOKIE = "ccc_access_token";
export const REFRESH_TOKEN_COOKIE = "ccc_refresh_token";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 2 * 60 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

type CookieOptions = {
  secure: boolean;
};

export function createAccessTokenCookie(
  value: string,
  options: CookieOptions,
): string {
  return serializeCookie({
    name: ACCESS_TOKEN_COOKIE,
    value,
    maxAgeSeconds: ACCESS_TOKEN_MAX_AGE_SECONDS,
    path: "/api",
    secure: options.secure,
  });
}

export function createRefreshTokenCookie(
  value: string,
  options: CookieOptions,
): string {
  return serializeCookie({
    name: REFRESH_TOKEN_COOKIE,
    value,
    maxAgeSeconds: REFRESH_TOKEN_MAX_AGE_SECONDS,
    path: "/auth",
    secure: options.secure,
  });
}

export function clearAccessTokenCookie(options: CookieOptions): string {
  return serializeCookie({
    name: ACCESS_TOKEN_COOKIE,
    value: "",
    maxAgeSeconds: 0,
    path: "/api",
    secure: options.secure,
  });
}

export function clearRefreshTokenCookie(options: CookieOptions): string {
  return serializeCookie({
    name: REFRESH_TOKEN_COOKIE,
    value: "",
    maxAgeSeconds: 0,
    path: "/auth",
    secure: options.secure,
  });
}

export function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = trimmed.slice(0, separatorIndex);
    if (cookieName !== name) {
      continue;
    }

    return decodeCookieValue(trimmed.slice(separatorIndex + 1));
  }

  return undefined;
}

function serializeCookie(input: {
  name: string;
  value: string;
  maxAgeSeconds: number;
  path: string;
  secure: boolean;
}): string {
  return [
    `${input.name}=${encodeURIComponent(input.value)}`,
    `Max-Age=${input.maxAgeSeconds}`,
    `Path=${input.path}`,
    "HttpOnly",
    "SameSite=Lax",
    input.secure ? "Secure" : undefined,
  ]
    .filter((attribute): attribute is string => Boolean(attribute))
    .join("; ");
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
