import { expect, test } from "vitest";
import { ca } from "./ca";
import { en } from "./en";
import { es } from "./es";
import { getTranslations } from ".";

function keysOf(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return keysOf(child, path);
  });
}

test("Spanish and English dictionaries match Catalan keys", () => {
  const catalanKeys = keysOf(ca).sort();

  expect(keysOf(es).sort()).toEqual(catalanKeys);
  expect(keysOf(en).sort()).toEqual(catalanKeys);
});

test("returns translations by locale", () => {
  expect(getTranslations("ca").site.name).toBe("Club d'Escacs Calella");
  expect(getTranslations("es").nav.login).toBe("Iniciar sesion");
  expect(getTranslations("en").nav.login).toBe("Log in");
});

test("admin users labels are available in each locale", () => {
  expect(getTranslations("ca").admin.users.loading).toBe("Carregant usuaris...");
  expect(getTranslations("es").admin.users.approve).toBe("Aprobar alta");
  expect(getTranslations("en").admin.users.disable).toBe("Disable account");
});
