import { env } from "./env";

interface Mail {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
}

/**
 * Send a transactional email through Brevo (https://api.brevo.com/v3/smtp/email).
 * Without BREVO_API_KEY (local development) the email is printed to the server log instead.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (!env.BREVO_API_KEY) {
    console.info(`[mail:dev] To: ${mail.to.email}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
    return;
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
}
