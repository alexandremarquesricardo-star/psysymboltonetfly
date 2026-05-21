import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// Newsletter signup → adds the email to a Resend Audience.
// Same conventions as deep-read.ts: Netlify Functions v2, Netlify.env for secrets,
// best-effort per-IP rate limit via Netlify Blobs.

const DAILY_LIMIT = 20; // signups attempts per IP per UTC day — abuse guard, generous for real use
const MAX_EMAIL_LEN = 254;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    return json({ ok: true });
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
  const store = getStore({ name: "subscribe-rate-limits", consistency: "strong" });
  const key = `${ip}:${todayUTC()}`;
  const current = parseInt((await store.get(key)) ?? "0", 10);
  if (current >= DAILY_LIMIT) {
    return json({ error: "Too many attempts. Please try again tomorrow." }, 429);
  }
  await store.set(key, String(current + 1));

  try {
    const resp = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      },
    );

    if (resp.ok) return json({ ok: true });

    // Already-subscribed should read as success to the visitor.
    const data: { message?: string } = await resp.json().catch(() => ({}));
    const msg = (data.message ?? "").toLowerCase();
    if (resp.status === 409 || msg.includes("already")) {
      return json({ ok: true });
    }

    return json({ error: "Couldn't subscribe right now. Please try again." }, 502);
  } catch {
    return json({ error: "Couldn't reach the mail service. Please try again." }, 502);
  }
};

export const config = {
  path: "/api/subscribe",
};
