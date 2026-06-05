import { describe, expect, test } from "vitest";
import { loader } from "./login";

describe("login route", () => {
  test("loads localized login form copy without route-local nav copy", async () => {
    const data = (await loader({
      params: {},
      request: new Request("https://club.example/es/login"),
    } as never)) as any;

    expect(data.locale).toBe("es");
    expect(data.copy.title).toBe("Iniciar sesion");
    expect(data.copy.usernameLabel).toBe("Usuario o correo");
    expect(data.copy.navPublic).toBeUndefined();
    expect(data.copy.navMember).toBeUndefined();
    expect(data.copy.navLogin).toBeUndefined();
    expect(data.copy.navRegister).toBeUndefined();
  });
});
