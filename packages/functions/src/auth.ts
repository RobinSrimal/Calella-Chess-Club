export type AuthHealthResponse = {
  service: "auth";
  status: "ok";
};

export type AuthErrorCode = "AUTH_ROUTE_NOT_FOUND";

export type AuthErrorResponse = {
  error: {
    code: AuthErrorCode;
  };
};

type JsonBody = AuthHealthResponse | AuthErrorResponse;

export async function handleAuthRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/auth/health") {
    const body: AuthHealthResponse = {
      service: "auth",
      status: "ok",
    };
    return jsonResponse(body);
  }

  const body: AuthErrorResponse = {
    error: {
      code: "AUTH_ROUTE_NOT_FOUND",
    },
  };
  return jsonResponse(body, { status: 404 });
}

function jsonResponse(body: JsonBody, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export default {
  fetch: handleAuthRequest,
};
