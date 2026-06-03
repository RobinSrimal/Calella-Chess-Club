import { base64UrlEncode, utf8Bytes } from "./encoding";

export type RandomByteSource = {
  randomBytes(length: number): Uint8Array;
};

export type VerificationToken = {
  token: string;
  tokenHash: string;
};

export type RefreshToken = {
  token: string;
  tokenHash: string;
};

const TOKEN_BYTE_LENGTH = 32;

export async function createVerificationToken(
  source: RandomByteSource = cryptoRandomByteSource,
): Promise<VerificationToken> {
  const token = base64UrlEncode(source.randomBytes(TOKEN_BYTE_LENGTH));
  return {
    token,
    tokenHash: await hashToken(token),
  };
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8Bytes(token));
  return base64UrlEncode(new Uint8Array(digest));
}

export async function createRefreshToken(
  secret: string,
  source: RandomByteSource = cryptoRandomByteSource,
): Promise<RefreshToken> {
  const token = base64UrlEncode(source.randomBytes(TOKEN_BYTE_LENGTH));
  return {
    token,
    tokenHash: await hashRefreshToken(token, secret),
  };
}

export async function hashRefreshToken(
  token: string,
  secret: string,
): Promise<string> {
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
  const signature = await crypto.subtle.sign("HMAC", key, utf8Bytes(token));
  return base64UrlEncode(new Uint8Array(signature));
}

const cryptoRandomByteSource: RandomByteSource = {
  randomBytes(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  },
};
