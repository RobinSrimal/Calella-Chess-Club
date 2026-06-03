import type { APIRoute } from "astro";
import { Resource } from "sst/resource/cloudflare";
import { forwardToBinding } from "../../lib/proxy";

export const ALL: APIRoute = ({ request }) => {
  return forwardToBinding(Resource.Api, request, "/api");
};
