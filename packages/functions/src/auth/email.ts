import type { Locale } from "./validation";

export type SendVerificationEmailInput = {
  fetch: typeof fetch;
  apiKey: string;
  from: string;
  to: string;
  username: string;
  locale: Locale;
  webOrigin: string;
  token: string;
};

export type SendVerificationEmailResult =
  | {
      ok: true;
    }
  | {
      ok: false;
    };

export async function sendVerificationEmail(
  input: SendVerificationEmailInput,
): Promise<SendVerificationEmailResult> {
  const verificationUrl = new URL(`/${input.locale}/verify-email`, input.webOrigin);
  verificationUrl.searchParams.set("token", input.token);

  const fetchEmail = input.fetch;
  const response = await fetchEmail("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: subjectForLocale(input.locale),
      html: htmlBody({
        username: input.username,
        verificationUrl: verificationUrl.toString(),
      }),
    }),
  });

  if (!response.ok) {
    return { ok: false };
  }

  return { ok: true };
}

function subjectForLocale(locale: Locale): string {
  if (locale === "es") {
    return "Verifica tu correo del Club d'Escacs Calella";
  }
  if (locale === "en") {
    return "Verify your Calella Chess Club email";
  }
  return "Verifica el teu correu del Club d'Escacs Calella";
}

function htmlBody(input: { username: string; verificationUrl: string }): string {
  const username = escapeHtml(input.username);
  const verificationUrl = escapeHtml(input.verificationUrl);

  return [
    `<p>Hola ${username},</p>`,
    "<p>Confirma el teu correu per continuar amb la sol-licitud d'alta al club.</p>",
    `<p><a href="${verificationUrl}">Verificar correu</a></p>`,
  ].join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
