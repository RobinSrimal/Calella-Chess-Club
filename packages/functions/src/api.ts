export type ApiHealthResponse = {
  service: "api";
  status: "ok";
};

export type ApiErrorCode = "API_ROUTE_NOT_FOUND";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
  };
};

type JsonBody = ApiHealthResponse | ApiErrorResponse;

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    const body: ApiHealthResponse = {
      service: "api",
      status: "ok",
    };
    return jsonResponse(body);
  }

  const body: ApiErrorResponse = {
    error: {
      code: "API_ROUTE_NOT_FOUND",
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
  fetch: handleApiRequest,
};
