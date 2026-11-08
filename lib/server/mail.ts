import { env } from "./env";

interface Mail {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
}

/** Whether the email really went out, and Brevo's id for it (to look it up in Brevo → Transactional → Logs). */
export interface SendResult {
  sent: boolean;
  messageId?: string;
}

/**
 * Send a transactional email through Brevo (https://api.brevo.com/v3/smtp/email).
 * Without BREVO_API_KEY the email is only printed to the server log, and the result says it was not sent,
 * so callers can tell the user instead of reporting success.
 */
export async function sendMail(mail: Mail): Promise<SendResult> {
  if (!env.BREVO_API_KEY) {
    console.warn(`[mail:dev] not sent (BREVO_API_KEY is not set). To: ${mail.to.email}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
    return { sent: false };
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM_EMAIL, name: env.MAIL_FROM_NAME },
      to: [mail.to],
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const messageId = ((await res.json().catch(() => ({}))) as { messageId?: string }).messageId;
  console.info(`[mail] sent "${mail.subject}" to ${mail.to.email}${messageId ? ` (Brevo ${messageId})` : ""}`);
  return { sent: true, messageId };
}

/** Shown when an email couldn't go out because no email service is configured. */
export const NOT_CONFIGURED = "Email isn't set up on this server (BREVO_API_KEY is missing), so no email was sent. Add the key to the web and worker services and redeploy.";
