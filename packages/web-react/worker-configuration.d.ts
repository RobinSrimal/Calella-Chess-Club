import type { Resource } from "sst";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Resource;
      ctx: ExecutionContext;
    };
  }
}

export {};
