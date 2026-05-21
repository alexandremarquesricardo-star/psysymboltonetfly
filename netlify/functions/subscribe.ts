import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

// Newsletter signup — DOUBLE OPT-IN.
// Validates the email, then emails a single-use confirmation link instead of
// adding the address straight to the Audience. The contact is only added once
// the link is clicked (see confirm.ts). This protects sender reputation and
// stops anyone signing up a third party. Same conventions as deep-read.ts.

const DAILY_LIMIT = 20; // attempts per IP per UTC day — abuse guard, generous for real use
const MAX_EMAIL_LEN = 254;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM = "PsySymbol <hello@psysymbol.com>";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function clientIP(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-nf-client-connection-ip") ?? "unknown";
}

function json(obj: object, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "https://psysymbol.com",
    },
  });
}

function confirmEmail(confirmUrl: string): { html: string; text: string } {
  const text = `Welcome to PsySymbol.

You're one click from the daily reading. Confirm your subscription:
${confirmUrl}

If you didn't sign up, just ignore this email — you won't be added and won't hear from us again.

PsySymbol — dream, symbol, and number meanings, thought through.`;

  const html = `<!doctype html><html><body style="margin:0;background:#10131c;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#10131c;padding:32px 16px;">
   <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#171a24;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:32px;">
      <tr><td style="font-size:20px;font-weight:600;color:#efeadf;padding-bottom:10px;">&#936;&nbsp;PsySymbol</td></tr>
      <tr><td style="font-size:16px;line-height:1.6;color:#cfcdc4;padding-bottom:24px;">You're one click from the daily reading. Confirm your subscription and we'll send one considered dream, symbol, or number interpretation &mdash; thought through, not fortune-teller theatre.</td></tr>
      <tr><td style="padding-bottom:24px;"><a href="${confirmUrl}" style="display:inline-block;background:#efeadf;color:#161821;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">Confirm subscription</a></td></tr>
      <tr><td style="font-size:13px;line-height:1.6;color:#8a8a82;">If you didn't sign up, ignore this email &mdash; you won't be added and won't hear from us again.</td></tr>
    </table>
   </td></tr>
  </table>
</body></html>`;
  return { html, text };
}

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: { email?: string; hp?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Honeypot: bots fill hidden fields. Accept silently so we don't tip them off.
  if (typeof body.hp === "string" && body.hp.trim() !== "") {
    return json({ ok: true, pending: true });
  }

  const email = (body.email ?? "").toString().trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  const apiKey = Netlify.env.get("RESEND_API_KEY");
  const audienceId = Netlify.env.get("RESEND_AUDIENCE_ID");
  if (!apiKey || !audienceId) {
    return json({ error: "The newsletter isn't live yet — check back soon." }, 503);
  }

  // Best-effort per-IP rate limit (small race window acceptable for an abuse guard).
  const ip = clientIP(request);
  const rl = getStore({ name: "subscribe-rate-limits", consistency: "strong" });
  const key = `${ip}:${todayUTC()}`;
  const current = parseInt((await rl.get(key)) ?? "0", 10);
  if (current >= DAILY_LIMIT) {
    return json({ error: "Too many attempts. Please try again tomorrow." }, 429);
  }
  await rl.set(key, String(current + 1));

  // Create a single-use confirmation token (double opt-in).
  const token = randomUUID();
  const pending = getStore({ name: "pending-subscriptions", consistency: "strong" });
  await pending.set(token, JSON.stringify({ email, ts: Date.now() }));

  const base = new URL(request.url).origin;
  const confirmUrl = `${base}/api/confirm?token=${token}`;
  const { html, text } = confirmEmail(confirmUrl);

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "Confirm your PsySymbol subscription",
        html,
        text,
      }),
    });

    if (resp.ok) return json({ ok: true, pending: true });
    return json({ error: "Couldn't send the confirmation email. Please try again." }, 502);
  } catch {
    return json({ error: "Couldn't reach the mail service. Please try again." }, 502);
  }
};

export const config = {
  path: "/api/subscribe",
};
