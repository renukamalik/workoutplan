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

`render.yaml` uses the free Render plan, which sleeps when idle (the first visit then takes about a minute). Change `plan: free` to `plan: starter` to keep it awake.

## Good to know
- Passwords are stored scrambled (bcrypt). Nobody can read them. Reset gives a new temporary password.
- WhatsApp opens one chat at a time with the message ready. Fully automatic WhatsApp sending needs the paid WhatsApp Business service.
- Download a full backup from Admin regularly. It contains health notes, so keep it private.
- Client health data needs her consent. The Add client form records it.

## Create plan, PDF and sending
- **Create plan** tab: pick a client, start from a template or "Write with Claude", edit, press Save plan, then use the Send panel at the bottom.
- The PDF is made on the server (`/api/plans/<id>/pdf`). Clients get a signed link (`/p/<token>`) that works for 60 days without a login.
- WhatsApp opens with the message and PDF link ready. Email opens in your email app, or sends the PDF attached if `RESEND_API_KEY` is set.
- Every message includes the app address from `APP_URL` (default https://rerise-app.onrender.com).

## AI setup (free)
GitHub's free model service (GitHub Models) was retired on 30 July 2026, and GitHub Copilot has no API for apps, so the app uses Google Gemini's free tier instead.
1. Go to https://aistudio.google.com/apikey and create an API key (a Google account is enough).
2. On Render, add `GEMINI_API_KEY`. Optionally set `GEMINI_MODEL` if Google renames the model. Redeploy.
3. You will see "Write with AI" on Create plan, "Change with AI" inside a plan, and "This week with AI" on the dashboard.

Free AI services may use what you send to improve their products. So saved health notes are not sent unless you set `AI_SHARE_HEALTH=true` or use the paid Claude option (`ANTHROPIC_API_KEY`). The AI never receives names, phone numbers or emails. The dashboard briefing uses first names and counts only.

See `docs/CLAUDE_PROJECT.md` for a ready-made brief to paste into a Claude Project.
