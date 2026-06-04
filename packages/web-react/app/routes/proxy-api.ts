import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Resource } from "sst/resource";
import { forwardToBinding } from "../lib/proxy";

export async function loader({ request }: LoaderFunctionArgs) {
  return forwardToBinding(Resource.Api, request, "/api");
}

export async function action({ request }: ActionFunctionArgs) {
  return forwardToBinding(Resource.Api, request, "/api");
}
