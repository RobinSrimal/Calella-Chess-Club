import type { ApiResult } from "./api-result";

export type { ApiResult };

export async function logout(): Promise<ApiResult<null>> {
  try {
    const response = await fetch("/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      return { ok: true, data: null, status: response.status };
    }

    const body = await response.json().catch(() => undefined);
    const error =
      body &&
      typeof body === "object" &&
      "error" in body &&
      body.error &&
      typeof body.error === "object"
        ? (body.error as { code?: unknown; fields?: unknown })
        : undefined;

    return {
      ok: false,
      code: typeof error?.code === "string" ? error.code : "UNKNOWN_ERROR",
      fields: Array.isArray(error?.fields)
        ? error.fields.filter((field): field is string => typeof field === "string")
        : undefined,
      status: response.status,
    };
  } catch {
    return { ok: false, code: "NETWORK_ERROR", status: 0 };
  }
}
