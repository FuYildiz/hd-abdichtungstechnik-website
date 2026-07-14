import { requireAdmin, unauthorizedResponse } from "./lib/auth.js";
import { insertLead, listLeads, updateLead, normalizeCategory, isValidStatus } from "./lib/db.js";
import { sendLeadNotification } from "./lib/email.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

async function handleContact(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid-json" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const message = (body.message || "").trim();
  const phone = (body.phone || "").trim();

  // Honeypot: unsichtbares Feld im Formular. Bots füllen es oft aus, Menschen nie.
  if (body.website) {
    return json({ ok: true });
  }

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return json({ error: "invalid-input" }, { status: 400 });
  }

  const lead = await insertLead(env.DB, {
    name,
    email,
    phone,
    message,
    category: normalizeCategory(body.category),
  });

  await sendLeadNotification(env, lead);

  return json({ ok: true });
}

async function handleListLeads(request, env) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || undefined;
  const status = url.searchParams.get("status") || undefined;

  const leads = await listLeads(env.DB, { category, status });
  return json({ leads });
}

async function handleUpdateLead(request, env, id) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid-json" }, { status: 400 });
  }

  if (body.status !== undefined && !isValidStatus(body.status)) {
    return json({ error: "invalid-status" }, { status: 400 });
  }

  const updated = await updateLead(env.DB, id, { status: body.status, notes: body.notes });
  if (!updated) return json({ error: "not-found" }, { status: 404 });

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env);
    }

    if (url.pathname.startsWith("/api/leads") || url.pathname.startsWith("/admin")) {
      const admin = requireAdmin(request, env);
      if (!admin) return unauthorizedResponse();

      if (url.pathname === "/api/leads" && request.method === "GET") {
        return handleListLeads(request, env);
      }

      const leadIdMatch = url.pathname.match(/^\/api\/leads\/([^/]+)$/);
      if (leadIdMatch && request.method === "PATCH") {
        return handleUpdateLead(request, env, leadIdMatch[1]);
      }

      // /admin/* (Dashboard-HTML/JS): authentifiziert, danach normal aus den Assets ausliefern
      if (url.pathname.startsWith("/admin")) {
        return env.ASSETS.fetch(request);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
