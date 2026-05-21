import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// Double opt-in confirmation endpoint. The link in the confirmation email points
// here (/api/confirm?token=...). On a valid, unexpired token we add the contact
// to the Resend Audience and consume the token. Returns a small styled HTML page
// because it's opened in a browser, not called by JS.

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // links valid for 7 days

function page(title: string, bodyHtml: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${title} — PsySymbol</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#10131c;color:#e8e6df;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-align:center;padding:24px}
  .card{max-width:460px;background:#171a24;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:36px}
  .brand{font-size:20px;font-weight:600;color:#efeadf;margin-bottom:18px}
  h1{font-size:22px;margin:0 0 12px}
  p{color:#cfcdc4;line-height:1.6;margin:0 0 22px}
  a.btn{display:inline-block;background:#efeadf;color:#161821;text-decoration:none;font-weight:600;padding:11px 20px;border-radius:10px}
</style></head><body><div class="card">
  <div class="brand">&#936; PsySymbol</div>
  <h1>${title}</h1>${bodyHtml}
  <a class="btn" href="https://psysymbol.com/">Go to PsySymbol &rarr;</a>
</div></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export default async (request: Request, _context: Context) => {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) {
    return page("Invalid link", "<p>This confirmation link is missing its token.</p>", 400);
  }

  const apiKey = Netlify.env.get("RESEND_API_KEY");
  const audienceId = Netlify.env.get("RESEND_AUDIENCE_ID");
  if (!apiKey || !audienceId) {
    return page("Not available yet", "<p>The newsletter isn't live yet — please try again soon.</p>", 503);
  }

  const pending = getStore({ name: "pending-subscriptions", consistency: "strong" });
  const raw = await pending.get(token);
  if (!raw) {
    return page(
      "Link expired or already used",
      "<p>This confirmation link is no longer valid. If you still want the daily reading, just sign up again.</p>",
      410,
    );
  }

  let rec: { email?: string; ts?: number };
  try {
    rec = JSON.parse(raw);
  } catch {
    rec = {};
  }
  const email = (rec.email ?? "").toLowerCase();
  if (!email || !rec.ts || Date.now() - rec.ts > MAX_AGE_MS) {
    await pending.delete(token);
    return page(
      "Link expired",
      "<p>This confirmation link has expired. Please sign up again to receive the daily reading.</p>",
      410,
    );
  }

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

    const data: { message?: string } = await resp.json().catch(() => ({}));
    const already = (data.message ?? "").toLowerCase().includes("already");

    if (resp.ok || resp.status === 409 || already) {
      await pending.delete(token);
      const title = already ? "Already confirmed" : "You're in";
      const msg = already
        ? "<p>You're already on the list — nothing more to do.</p>"
        : "<p>Your subscription to PsySymbol is confirmed. The next reading will land in your inbox.</p>";
      return page(title, msg);
    }

    return page(
      "Something went wrong",
      "<p>We couldn't confirm your subscription right now. Please try the link again in a moment.</p>",
      502,
    );
  } catch {
    return page(
      "Something went wrong",
      "<p>We couldn't reach the mail service. Please try the link again in a moment.</p>",
      502,
    );
  }
};

export const config = {
  path: "/api/confirm",
};
