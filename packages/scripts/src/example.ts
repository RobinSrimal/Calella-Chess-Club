import { Resource } from "sst";
import { Example } from "@CCC/core/example";

const databaseStatus =
  typeof Resource.Database.prepare === "function"
    ? "D1 binding ready"
    : "D1 binding missing";

console.log(`${Example.hello()} ${databaseStatus}.`);
