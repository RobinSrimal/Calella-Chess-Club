import { base64UrlEncode, utf8Bytes } from "./encoding";

export type RandomByteSource = {
  randomBytes(length: number): Uint8Array;
};

export type VerificationToken = {
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

const cryptoRandomByteSource: RandomByteSource = {
  randomBytes(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  },
};
