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
    expect(data.copy.registerCta).toBe("Register");
    expect(data.copy.adminCta).toBeUndefined();
  });

  test("exposes an admin users link on the admin shell", async () => {
    const data = (await loader({
      params: { locale: "ca" },
      request: new Request("https://club.example/ca/admin"),
    } as never)) as any;

    expect(data.section).toBe("admin");
    expect(data.copy.adminUsersCta).toBe("Gestionar usuaris");
  });
});
