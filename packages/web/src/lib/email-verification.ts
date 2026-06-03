const AUTH_ORIGIN = "https://auth.internal";

export type EmailVerificationBinding = {
  fetch(request: Request): Promise<Response>;
};

export type EmailVerificationResult =
  | {
      status: "missing-token";
    }
  | {
      status: "verified";
      membershipStatus: string;
    }
  | {
      status: "error";
      code: string;
      statusCode: number;
    };

export async function verifyEmailToken(input: {
  token: string | null;
  auth: EmailVerificationBinding;
}): Promise<EmailVerificationResult> {
  if (!input.token) {
    return { status: "missing-token" };
  }

  const url = new URL("/auth/verify-email", AUTH_ORIGIN);
  url.searchParams.set("token", input.token);

  let response: Response;
  try {
    response = await input.auth.fetch(new Request(url, { method: "GET" }));
  } catch {
    return {
      status: "error",
      code: "AUTH_VERIFICATION_FAILED",
      statusCode: 0,
    };
  }

  const body = await readJson(response);

  if (response.ok && isRecord(body) && body.verified === true) {
    return {
      status: "verified",
      membershipStatus:
        typeof body.membershipStatus === "string" ? body.membershipStatus : "pending",
    };
  }

  return {
    status: "error",
    code: stableErrorCode(body),
    statusCode: response.status,
  };
}

function stableErrorCode(body: unknown) {
  if (
    isRecord(body) &&
    isRecord(body.error) &&
    typeof body.error.code === "string"
  ) {
    return body.error.code;
  }

  return "AUTH_VERIFICATION_FAILED";
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
