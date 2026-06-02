import { Resource } from "sst";
import { Example } from "@CCC/core/example";

export function health() {
  return {
    message: Example.hello(),
    databaseId: Resource.Database.databaseId,
  };
}
