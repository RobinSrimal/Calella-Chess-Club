const LOCALES = ["ca", "es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export type RegisterBody = {
  username: string;
  usernameNormalized: string;
  email: string;
  emailNormalized: string;
  password: string;
  locale: Locale;
};

export type RegisterBodyResult =
  | {
      ok: true;
      value: RegisterBody;
    }
  | {
      ok: false;
      fields: string[];
    };

export type LoginBody = {
  usernameOrEmail: string;
  usernameOrEmailNormalized: string;
  password: string;
};

export type LoginBodyResult =
  | {
      ok: true;
      value: LoginBody;
    }
  | {
      ok: false;
      fields: string[];
    };

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseRegisterBody(body: unknown): RegisterBodyResult {
  if (!isRecord(body)) {
    return { ok: false, fields: ["body"] };
  }

  const fields: string[] = [];
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const localeValue = typeof body.locale === "string" ? body.locale : "ca";
  const locale = isLocale(localeValue) ? localeValue : undefined;

  if (!isValidUsername(username)) {
    fields.push("username");
  }
  if (!isValidEmail(email)) {
    fields.push("email");
  }
  if (password.length < 12) {
    fields.push("password");
  }
  if (!locale) {
    fields.push("locale");
  }

  if (fields.length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      username,
      usernameNormalized: normalizeUsername(username),
      email,
      emailNormalized: email,
      password,
      locale: locale ?? "ca",
    },
  };
}

export function parseLoginBody(body: unknown): LoginBodyResult {
  if (!isRecord(body)) {
    return { ok: false, fields: ["body"] };
  }

  const fields: string[] = [];
  const usernameOrEmail =
    typeof body.usernameOrEmail === "string" ? body.usernameOrEmail.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (usernameOrEmail.length === 0) {
    fields.push("usernameOrEmail");
  }
  if (password.length === 0) {
    fields.push("password");
  }

  if (fields.length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      usernameOrEmail,
      usernameOrEmailNormalized: usernameOrEmail.includes("@")
        ? normalizeEmail(usernameOrEmail)
        : normalizeUsername(usernameOrEmail),
      password,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_-]{3,32}$/.test(username);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
