import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { config } from "@/lib/config";

let transporter: Transporter | null = null;

/** Échappe les valeurs saisies par les utilisateurs avant de les insérer dans un e-mail HTML. */
export function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function getTransporter() {
  if (!config.mail.host) return null;
  transporter ??= nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.password } : undefined,
  });
  return transporter;
}

function layout(title: string, body: string, cta?: { label: string; url: string }) {
  // Les messageries n'affichent pas le SVG : on utilise la version PNG du logo.
  const logo = `${config.appUrl}/brand/logo-email.png`;
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f7f7f5;font-family:Inter,Arial,sans-serif;color:#141413">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #efefec">
    <tr><td style="padding:22px 28px;border-bottom:4px solid #f2e924"><img src="${logo}" alt="Reelance" height="30" style="height:30px;width:auto;display:block;border:0"></td></tr>
    <tr><td style="padding:28px">
      <h1 style="font-size:20px;margin:0 0 12px;color:#0a0a0a">${esc(title)}</h1>
      <div style="font-size:15px;line-height:1.6;color:#3f3f3b">${body}</div>
      ${cta ? `<p style="margin:24px 0 0"><a href="${cta.url}" style="display:inline-block;background:#f2e924;color:#0a0a0a;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">${esc(cta.label)}</a></p>` : ""}
    </td></tr>
    <tr><td style="padding:16px 28px;background:#0a0a0a;font-size:12px;color:#c3c3bc">Reelance — la marketplace des monteurs vidéo d'Afrique francophone.</td></tr>
  </table></td></tr></table></body></html>`;
}

export async function sendMail(input: { to: string; subject: string; title: string; body: string; cta?: { label: string; url: string } }) {
  const html = layout(input.title, input.body, input.cta);
  const text = `${input.title}\n\n${input.body.replace(/<[^>]+>/g, "")}${input.cta ? `\n\n${input.cta.label} : ${input.cta.url}` : ""}`;
  const t = getTransporter();
  if (!t) {
    console.info(`[mail] (SMTP non configuré) À : ${input.to} — ${input.subject}\n${text}`);
    return;
  }
  try {
    await t.sendMail({ from: config.mail.from, to: input.to, subject: input.subject, html, text });
  } catch (err) {
    console.error("[mail] envoi impossible", err);
  }
}
