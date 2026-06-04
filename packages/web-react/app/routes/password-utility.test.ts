import { describe, expect, test } from "vitest";
import { loader as forgotPasswordLoader } from "./forgot-password";
import { loader as resetPasswordLoader } from "./reset-password";

describe("password utility routes", () => {
  test("loads localized forgot-password informational copy", async () => {
    const data = (await forgotPasswordLoader({
      params: {},
      request: new Request("https://club.example/ca/forgot-password"),
    } as never)) as any;

    expect(data.locale).toBe("ca");
    expect(data.copy.title).toBe("Recuperar contrasenya");
    expect(data.copy.body).toBe(
      "La recuperació automàtica de contrasenya encara no està activada. Contacta amb un administrador del club per rebre ajuda.",
    );
    expect(data.copy.submitLabel).toBeUndefined();
  });

  test("loads localized reset-password informational copy", async () => {
    const data = (await resetPasswordLoader({
      params: {},
      request: new Request("https://club.example/en/reset-password"),
    } as never)) as any;

    expect(data.locale).toBe("en");
    expect(data.copy.title).toBe("Reset password");
    expect(data.copy.body).toBe("Password reset links are not enabled yet.");
    expect(data.copy.submitLabel).toBeUndefined();
  });
});
