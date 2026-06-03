import { expect, test, vi } from "vitest";
import { sendVerificationEmail } from "./email";

test("sends localized verification email through Resend", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));

  const result = await sendVerificationEmail({
    fetch: fetchMock,
    apiKey: "resend-secret",
    from: "Calella Chess Club <noreply@example.com>",
    to: "robin@example.com",
    username: "RobinSrimal",
    locale: "ca",
    webOrigin: "https://club.example",
    token: "raw-token",
  });

  expect(result).toEqual({ ok: true });
  expect(fetchMock).toHaveBeenCalledOnce();
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://api.resend.com/emails");
  expect(init.headers).toEqual({
    authorization: "Bearer resend-secret",
    "content-type": "application/json",
  });
  expect(JSON.parse(init.body)).toEqual({
    from: "Calella Chess Club <noreply@example.com>",
    to: "robin@example.com",
    subject: "Verifica el teu correu del Club d'Escacs Calella",
    html: expect.stringContaining(
      "https://club.example/ca/verify-email?token=raw-token",
    ),
  });
});

test("reports Resend delivery failures", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response("bad request", { status: 400 }));

  const result = await sendVerificationEmail({
    fetch: fetchMock,
    apiKey: "resend-secret",
    from: "Calella Chess Club <noreply@example.com>",
    to: "robin@example.com",
    username: "RobinSrimal",
    locale: "en",
    webOrigin: "https://club.example",
    token: "raw-token",
  });

  expect(result).toEqual({ ok: false });
});
