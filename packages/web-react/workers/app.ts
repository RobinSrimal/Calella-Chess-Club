import { createRequestHandler } from "react-router";
import type { ServerBuild } from "react-router";
import type { Resource } from "sst";

const requestHandler = createRequestHandler(
  () =>
    import("virtual:react-router/server-build") as unknown as Promise<ServerBuild>,
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Resource>;
