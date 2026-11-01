# Rerise coaching app

Workout plans for your clients, with a coach login and a client login.

**Coach:** dashboard, clients (add, edit, share login), plan builder with video links, send plans by WhatsApp and email, admin tab (all logins, import, export, backup).
**Client:** her plan with Watch buttons and Done ticks, weekly check-in, her own profile.

## Run it on your computer
```
npm install
cp .env.example .env.local     # fill in ADMIN_EMAIL and ADMIN_PASSWORD
npm run dev
```
With no `DATABASE_URL`, data is kept in a local folder (`.data`). Open http://localhost:3000.

## Put it online (Neon database + Render hosting)
1. **Neon:** create a free project, copy the connection string.
2. **Render:** New > Blueprint, pick this repo. It reads `render.yaml`.
3. Set these environment variables on Render: `DATABASE_URL` (Neon string), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `APP_URL` (your Render address). `AUTH_SECRET` is generated for you.
4. Open the address and log in as the coach. Tables and your first template plan are created on first start.
5. Optional: add `RESEND_API_KEY` and `EMAIL_FROM` to send emails from the app. Without them, the Email buttons open your own email app.

The free Render plan sleeps when idle. The `starter` plan in `render.yaml` stays awake.

## Good to know
- Passwords are stored scrambled (bcrypt). Nobody can read them. Reset gives a new temporary password.
- WhatsApp opens one chat at a time with the message ready. Fully automatic WhatsApp sending needs the paid WhatsApp Business service.
- Download a full backup from Admin regularly. It contains health notes, so keep it private.
- Client health data needs her consent. The Add client form records it.
