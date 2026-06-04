import { describe, expect, test } from "vitest";
import { loader, messageForVerificationErrorCode } from "./verify-email";

describe("verify email route", () => {
  test("loads localized copy and token from the URL", async () => {
    const data = (await loader({
      params: {},
      request: new Request("https://club.example/es/verify-email?token=raw-token"),
    } as never)) as any;

    expect(data.locale).toBe("es");
    expect(data.token).toBe("raw-token");
    expect(data.copy.title).toBe("Verificación del correo");
  });

  test("returns an empty token when the URL has no token", async () => {
    const data = (await loader({
      params: {},
      request: new Request("https://club.example/ca/verify-email"),
    } as never)) as any;

    expect(data.locale).toBe("ca");
    expect(data.token).toBe("");
    expect(data.copy.missingToken).toBe(
      "L'enllaç de verificació no inclou cap token.",
    );
  });

  test("maps verification error codes to English messages", () => {
    expect(messageForVerificationErrorCode("AUTH_VERIFICATION_TOKEN_INVALID")).toBe(
      "This verification link is invalid.",
    );
    expect(messageForVerificationErrorCode("AUTH_VERIFICATION_TOKEN_USED")).toBe(
      "This verification link has already been used.",
    );
    expect(messageForVerificationErrorCode("AUTH_VERIFICATION_TOKEN_EXPIRED")).toBe(
      "This verification link has expired.",
    );
    expect(messageForVerificationErrorCode("NETWORK_ERROR")).toBe(
      "Network error. Check your connection and try again.",
    );
    expect(messageForVerificationErrorCode("OTHER")).toBe(
      "Email verification failed.",
    );
  });
});
