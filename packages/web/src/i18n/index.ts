import type { Locale } from "../lib/locale";
import { ca } from "./ca";
import { en } from "./en";
import { es } from "./es";

export const dictionaries = {
  ca,
  es,
  en,
} as const;

export type Translations = (typeof dictionaries)[Locale];

export function getTranslations(locale: Locale): Translations {
  return dictionaries[locale];
}
