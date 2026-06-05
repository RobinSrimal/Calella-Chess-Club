export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; code: string; fields?: string[]; status: number };

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    return readJsonResult<T>(await fetch(input, init));
  } catch {
    return { ok: false, code: "NETWORK_ERROR", status: 0 };
  }
}

async function readJsonResult<T>(response: Response): Promise<ApiResult<T>> {
  const body = await response.json().catch(() => undefined);

  if (response.ok) {
    return { ok: true, data: body as T, status: response.status };
  }

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
}
