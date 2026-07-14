const VALID_CATEGORIES = ["Flachdach", "Balkon", "Garage", "Terrasse", "Sockel", "Bad/Dusche", "Sonstiges"];
const VALID_STATUSES = ["neu", "kontaktiert", "angebot", "auftrag", "abgelehnt"];

export function normalizeCategory(value) {
  return VALID_CATEGORIES.includes(value) ? value : "Sonstiges";
}

export function isValidStatus(value) {
  return VALID_STATUSES.includes(value);
}

export async function insertLead(db, lead) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO leads (id, name, email, phone, message, category, status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'neu', 'website', ?, ?)`
    )
    .bind(id, lead.name, lead.email, lead.phone || null, lead.message, lead.category, now, now)
    .run();

  return { id, ...lead, status: "neu", source: "website", created_at: now, updated_at: now };
}

export async function listLeads(db, { category, status } = {}) {
  let query = "SELECT * FROM leads WHERE 1=1";
  const params = [];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  query += " ORDER BY created_at DESC";

  const { results } = await db.prepare(query).bind(...params).all();
  return results;
}

export async function updateLead(db, id, { status, notes }) {
  const now = new Date().toISOString();
  const fields = [];
  const params = [];

  if (status !== undefined) {
    fields.push("status = ?");
    params.push(status);
  }
  if (notes !== undefined) {
    fields.push("notes = ?");
    params.push(notes);
  }

  if (fields.length === 0) return null;

  fields.push("updated_at = ?");
  params.push(now, id);

  const result = await db
    .prepare(`UPDATE leads SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();

  return result.meta.changes > 0;
}
