import { describe, expect, test } from "vitest";
import { loader } from "./register";

describe("register route", () => {
  test("loads localized registration form copy without route-local nav copy", async () => {
    const data = (await loader({
      params: {},
      request: new Request("https://club.example/ca/register"),
    } as never)) as any;

    expect(data.locale).toBe("ca");
    expect(data.copy.title).toBe("Crear un compte");
    expect(data.copy.emailLabel).toBe("Correu electronic");
    expect(data.copy.navPublic).toBeUndefined();
    expect(data.copy.navLogin).toBeUndefined();
    expect(data.copy.navRegister).toBeUndefined();
  });
});
