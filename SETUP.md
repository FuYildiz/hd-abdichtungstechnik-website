# Setup & Deployment

## 1. Voraussetzungen
- `npm install` (installiert Wrangler lokal)
- `npx wrangler login` (einmalig, verbindet mit deinem Cloudflare-Account)

## 2. D1-Datenbank anlegen
```
npx wrangler d1 create hd-abdichtungstechnik
```
Die Ausgabe enthält eine `database_id` — die in `wrangler.jsonc` bei
`d1_databases[0].database_id` eintragen (ersetzt `REPLACE_WITH_D1_DATABASE_ID`).

Danach Schema anwenden:
```
npm run migrate:local    # für lokale Entwicklung
npm run migrate:remote   # für die echte (Produktions-)Datenbank
```

## 3. Secrets setzen (Produktion)
```
npx wrangler secret put ADMIN_USER
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put FROM_EMAIL      # z.B. "HD Abdichtungstechnik <anfrage@hdabdichtungstechnik.de>"
npx wrangler secret put NOTIFY_EMAIL    # z.B. "hdabdtech@outlook.de"
```

## 4. Resend (E-Mail-Versand) einrichten
1. Account auf resend.com anlegen.
2. Domain `hdabdichtungstechnik.de` hinzufügen und verifizieren (Resend zeigt
   DNS-Einträge an, die bei Cloudflare unter der Domain ergänzt werden müssen —
   erst möglich, sobald die Domain auf Cloudflare läuft, siehe Schritt 6).
3. API-Key erzeugen, als `RESEND_API_KEY` setzen (Schritt 3).
   Ohne gesetzten Key läuft das Formular im Dry-Run: Anfragen werden trotzdem
   in D1 gespeichert, nur die Benachrichtigungsmail wird stattdessen geloggt.

## 5. Lokal entwickeln
`.dev.vars` im Projekt-Root anlegen (wird nicht committed):
```
ADMIN_USER=admin
ADMIN_PASSWORD=ein-test-passwort
```
Dann:
```
npm run dev
```
Formular auf `http://localhost:8787` testen, `/admin` zeigt das Dashboard
(Basic-Auth-Prompt des Browsers mit den Werten aus `.dev.vars`).

## 6. Deployen
```
npm run deploy
```
Danach im Cloudflare-Dashboard unter dem Worker „hd-abdichtungstechnik" eine
Custom Domain `hdabdichtungstechnik.de` hinzufügen. Voraussetzung: die Domain
läuft auf Cloudflare-Nameservern (aktuell noch bei WordPress) — Nameserver
dort umstellen, sobald der neue Auftritt final geprüft ist.

## 7. Danach prüfen
- Formular auf der Live-Domain absenden → Eintrag erscheint unter `/admin`.
- Benachrichtigungsmail kommt an `NOTIFY_EMAIL` an.
- `/admin` ohne gültige Zugangsdaten liefert 401.
