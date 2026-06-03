import { Resource } from "sst";
import { ACCESS_TOKEN_COOKIE, readCookie } from "./auth/cookies";
import { verifyAccessJwt } from "./auth/jwt";
import {
  type AuthRepository,
  type PublicUser,
  createD1AuthRepository,
} from "./auth/repository";

export type ApiHealthResponse = {
  service: "api";
  status: "ok";
};

export type ApiErrorCode =
  | "API_AUTH_INVALID"
  | "API_AUTH_REQUIRED"
  | "API_ROUTE_NOT_FOUND";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
  };
};

export type MeResponse = {
  user: PublicUser;
};

export type ApiContext = {
  repository: Pick<AuthRepository, "findPublicUserById">;
  jwtSigningSecret: string;
  now: () => Date;
};

type JsonBody = ApiHealthResponse | ApiErrorResponse | MeResponse;

export async function handleApiRequest(
  request: Request,
  context?: ApiContext,
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    const body: ApiHealthResponse = {
      service: "api",
      status: "ok",
    };
    return jsonResponse(body);
  }

  if (request.method === "GET" && url.pathname === "/api/me") {
    return me(request, context ?? createDefaultApiContext());
  }

  return errorResponse("API_ROUTE_NOT_FOUND", 404);
}

function jsonResponse(body: JsonBody, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

async function me(request: Request, context: ApiContext): Promise<Response> {
  const accessToken = readCookie(request, ACCESS_TOKEN_COOKIE);
  if (!accessToken) {
    return errorResponse("API_AUTH_REQUIRED", 401);
  }

  const verified = await verifyAccessJwt(accessToken, {
    secret: context.jwtSigningSecret,
    now: context.now(),
  });
  if (!verified.ok) {
    return errorResponse("API_AUTH_INVALID", 401);
  }

  const user = await context.repository.findPublicUserById(verified.userId);
  if (!user) {
    return errorResponse("API_AUTH_INVALID", 401);
  }

  return jsonResponse({
    user,
  });
}

function errorResponse(code: ApiErrorCode, status: number): Response {
  return jsonResponse(
    {
      error: {
        code,
      },
    },
    { status },
  );
}

function createDefaultApiContext(): ApiContext {
  return {
    repository: createD1AuthRepository(Resource.Database),
    jwtSigningSecret: Resource.JwtSigningSecret.value,
    now: () => new Date(),
  };
}

export default {
  fetch(request: Request) {
    return handleApiRequest(request);
  },
};
