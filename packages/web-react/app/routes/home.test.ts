import { describe, expect, test } from "vitest";
import { loader } from "./home";

describe("home route copy", () => {
  test("uses login as the public action instead of admin", async () => {
    const data = (await loader({
      params: { locale: "en" },
      request: new Request("https://club.example/en"),
    } as never)) as any;

    expect(data.copy.navLogin).toBe("Log in");
    expect(data.copy.loginCta).toBe("Log in");
    expect(data.copy.adminCta).toBeUndefined();
  });
});
