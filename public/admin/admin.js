const STATUSES = ["neu", "kontaktiert", "angebot", "auftrag", "abgelehnt"];

const tbody = document.querySelector("#leads-body");
const emptyState = document.querySelector("#empty-state");
const filterCategory = document.querySelector("#filter-category");
const filterStatus = document.querySelector("#filter-status");

function formatDate(iso) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function statusSelectHtml(lead) {
  const options = STATUSES.map(
    (s) => `<option value="${s}" ${s === lead.status ? "selected" : ""}>${s}</option>`
  ).join("");
  return `<select data-id="${lead.id}" class="status-select">${options}</select>`;
}

async function loadLeads() {
  const params = new URLSearchParams();
  if (filterCategory.value) params.set("category", filterCategory.value);
  if (filterStatus.value) params.set("status", filterStatus.value);

  const res = await fetch(`/api/leads?${params.toString()}`);
  if (!res.ok) return;

  const { leads } = await res.json();
  tbody.innerHTML = "";
  emptyState.hidden = leads.length > 0;

  for (const lead of leads) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(lead.created_at)}</td>
      <td>${escapeHtml(lead.name)}</td>
      <td>
        <a class="mailto" href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a><br>
        ${lead.phone ? escapeHtml(lead.phone) : ""}
      </td>
      <td><span class="badge">${escapeHtml(lead.category)}</span></td>
      <td class="message">${escapeHtml(lead.message)}</td>
      <td>${statusSelectHtml(lead)}</td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async (e) => {
      await fetch(`/api/leads/${e.target.dataset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: e.target.value }),
      });
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

document.querySelector("#refresh").addEventListener("click", loadLeads);
filterCategory.addEventListener("change", loadLeads);
filterStatus.addEventListener("change", loadLeads);

loadLeads();
