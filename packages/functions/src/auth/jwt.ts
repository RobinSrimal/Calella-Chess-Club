import {
  base64UrlDecode,
  base64UrlEncode,
  utf8Bytes,
  utf8String,
} from "./encoding";

export type SignAccessJwtInput = {
  secret: string;
  userId: string;
  issuedAt: Date;
  expiresAt: Date;
};

export type VerifyAccessJwtInput = {
  secret: string;
  now: Date;
};

type JwtHeader = {
  alg: "HS256";
  typ: "JWT";
};

type AccessJwtPayload = {
  sub: string;
  iat: number;
  exp: number;
};

export async function signAccessJwt(input: SignAccessJwtInput): Promise<string> {
  const header: JwtHeader = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload: AccessJwtPayload = {
    sub: input.userId,
    iat: secondsSinceEpoch(input.issuedAt),
    exp: secondsSinceEpoch(input.expiresAt),
  };
  const encodedHeader = base64UrlEncode(utf8Bytes(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(utf8Bytes(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSha256(signingInput, input.secret);

  return `${signingInput}.${signature}`;
}

export async function verifyAccessJwt(
  token: string,
  input: VerifyAccessJwtInput,
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { ok: false };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = await hmacSha256(signingInput, input.secret);
  if (!constantTimeStringEquals(encodedSignature, expectedSignature)) {
    return { ok: false };
  }

  const header = parseJson<Partial<JwtHeader>>(encodedHeader);
  if (header?.alg !== "HS256" || header.typ !== "JWT") {
    return { ok: false };
  }

  const payload = parseJson<Partial<AccessJwtPayload>>(encodedPayload);
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    return { ok: false };
  }

  if (payload.exp <= secondsSinceEpoch(input.now)) {
    return { ok: false };
  }

  return {
    ok: true,
    userId: payload.sub,
  };
}

async function hmacSha256(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8Bytes(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, utf8Bytes(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function parseJson<T>(encoded: string): T | undefined {
  try {
    return JSON.parse(utf8String(base64UrlDecode(encoded))) as T;
  } catch {
    return undefined;
  }
}

function constantTimeStringEquals(left: string, right: string): boolean {
  const leftBytes = utf8Bytes(left);
  const rightBytes = utf8Bytes(right);
  let diff = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return diff === 0;
}

function secondsSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
