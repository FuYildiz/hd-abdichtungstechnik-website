export async function sendLeadNotification(env, lead) {
  if (!env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY fehlt — Benachrichtigung wird nur geloggt:", lead);
    return { simulated: true };
  }

  const subject = `Neue Anfrage (${lead.category}): ${lead.name}`;
  const body = [
    `Neue Anfrage über die Website.`,
    ``,
    `Name: ${lead.name}`,
    `E-Mail: ${lead.email}`,
    `Telefon: ${lead.phone || "-"}`,
    `Kategorie: ${lead.category}`,
    ``,
    `Nachricht:`,
    lead.message,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || "HD Abdichtungstechnik <onboarding@resend.dev>",
      to: env.NOTIFY_EMAIL || "hdabdtech@outlook.de",
      reply_to: lead.email,
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Resend-Fehler:", res.status, errorText);
    return { sent: false, error: errorText };
  }

  return { sent: true };
}
