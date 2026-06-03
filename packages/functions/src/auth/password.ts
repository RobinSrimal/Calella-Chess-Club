import bcrypt from "bcryptjs";
import { base64UrlEncode, utf8Bytes } from "./encoding";

export const PASSWORD_HASH_ALGORITHM = "bcrypt-sha256-pepper";

export type PasswordHashResult = {
  algorithm: typeof PASSWORD_HASH_ALGORITHM;
  hash: string;
};

export type PasswordHashOptions = {
  cost?: number;
};

const DEFAULT_BCRYPT_COST = 12;

export async function hashPassword(
  password: string,
  pepper: string,
  options: PasswordHashOptions = {},
): Promise<PasswordHashResult> {
  const hashInput = await passwordHashInput(password, pepper);
  const hash = await bcrypt.hash(hashInput, options.cost ?? DEFAULT_BCRYPT_COST);

  return {
    algorithm: PASSWORD_HASH_ALGORITHM,
    hash,
  };
}

export async function verifyPassword(
  password: string,
  pepper: string,
  hash: string,
): Promise<boolean> {
  const hashInput = await passwordHashInput(password, pepper);
  return bcrypt.compare(hashInput, hash);
}

async function passwordHashInput(password: string, pepper: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    utf8Bytes(`${pepper}\u0000${password}`),
  );
  return base64UrlEncode(new Uint8Array(digest));
}
