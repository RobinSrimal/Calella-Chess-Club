import { describe, expect, test } from "vitest";
import { loader } from "./home";

describe("home route copy", () => {
  test("uses chess-club public landing copy", async () => {
    const data = (await loader({
      params: { locale: "ca" },
      request: new Request("https://club.example/ca"),
    } as never)) as any;

    expect(data.copy.title).toBe("Escacs, formació i competició a Calella");
    expect(data.copy.clubIntroTitle).toBe("Un club obert al tauler");
    expect(data.copy.publicPostsTitle).toBe("Notícies del club");
    expect(data.copy.publicPostsEmpty).toBe(
      "Encara no hi ha notícies aprovades per a la portada.",
    );
  });

  test("keeps development-process copy out of the public landing page", async () => {
    const data = (await loader({
      params: { locale: "en" },
      request: new Request("https://club.example/en"),
    } as never)) as any;
    const publicCopy = JSON.stringify(data.copy).toLowerCase();

    expect(publicCopy).not.toContain("react");
    expect(publicCopy).not.toContain("deployment");
    expect(publicCopy).not.toContain("deploy");
    expect(publicCopy).not.toContain("proxy");
    expect(publicCopy).not.toContain("migration");
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

  test("exposes a posts link on the member shell", async () => {
    const data = (await loader({
      params: { locale: "ca" },
      request: new Request("https://club.example/ca/member"),
    } as never)) as any;

    expect(data.section).toBe("member");
    expect(data.copy.memberPostsCta).toBe("Escriure posts");
  });
});
