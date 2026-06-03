const BINDING_ORIGIN = "https://binding.internal";

export type ProxyBinding = {
  fetch(
    input: URL,
    init?: {
      method?: string;
      headers?: Headers;
      body?: ArrayBuffer;
    },
  ): Promise<unknown>;
};

export async function forwardToBinding(
  binding: ProxyBinding,
  request: Request,
  prefix: string,
): Promise<Response> {
  const sourceUrl = new URL(request.url);

  if (!isPathInPrefix(sourceUrl.pathname, prefix)) {
    return Response.json(
      { error: { code: "WEB_PROXY_ROUTE_NOT_FOUND" } },
      { status: 404 },
    );
  }

  const targetUrl = new URL(`${sourceUrl.pathname}${sourceUrl.search}`, BINDING_ORIGIN);
  const body = allowsBody(request.method) ? await request.arrayBuffer() : undefined;

  const response = await binding.fetch(targetUrl, {
    method: request.method,
    headers: new Headers(request.headers),
    body,
  });

  return response as Response;
}

function isPathInPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function allowsBody(method: string) {
  return method !== "GET" && method !== "HEAD";
}
