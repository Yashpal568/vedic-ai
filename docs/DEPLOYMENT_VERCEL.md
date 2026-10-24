# Vedic AI — Vercel deployment runbook

This is the exact setup for the repository `Yashpal568/vedic-ai`. The app is a Next.js App Router project; use Vercel's native Next.js build, not a static export.

## What you need before starting

- A GitHub account with access to `Yashpal568/vedic-ai`.
- A Vercel account connected to that GitHub account.
- A Supabase project for sign-in, conversation history, and saved kundli reports.
- One AI provider key: Google Gemini **or** OpenAI. Gemini is the configured default.
- A phone/browser for testing the magic-link email and mobile layout.

Never paste API keys, passwords, Supabase service-role keys, or recovery codes into GitHub issues, source files, or chat. Enter secrets directly into the provider/Vercel dashboards. The service-role key must not have a `NEXT_PUBLIC_` prefix and must only be read by server-side modules.

## 1. Prepare Supabase (database + sign-in)

1. Open [Supabase](https://supabase.com/) and create a project. Save the database password in your password manager; Vedic AI does not need that password in its environment variables.
2. Wait for the project to finish provisioning.
3. Open **SQL Editor → New query**.
4. Run the migration files **in order**, each in its own SQL Editor query:
   - [001 — initial schema](../supabase/migrations/202610240001_initial_schema.sql)
   - [002 — user-editable context memory](../supabase/migrations/202610240002_user_memory.sql)
   - [003 — persistence and security hardening](../supabase/migrations/202610240003_persistence_security_hardening.sql)
5. Confirm each query succeeds. In **Table Editor**, check for `profiles`, `birth_profiles`, `conversations`, `chat_messages`, `kundli_reports`, and `user_memories`. The migrations enable Row Level Security (RLS); do not turn RLS off. Migration 003 also updates conversation recency when messages are saved and permits users to delete their own profile row.
6. Open **Project Settings → API** (or the project's API/Connect details). Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Public anon key / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   Use only the public client key here. **Never use `service_role` or a secret key** as the anon key.
7. Open **Authentication → URL Configuration**:
   - Site URL: the Vercel production URL after you know it, for example `https://vedic-ai-your-team.vercel.app`.
   - Redirect URLs: add `http://localhost:3000/auth/callback` for local development, the exact Vercel production callback `https://YOUR-VERCEL-DOMAIN/auth/callback`, and the Vercel preview callback pattern only if you intend to test sign-in on previews. Replace the placeholder with your real domain.
8. In **Authentication → Providers**, ensure Email is enabled. The app uses passwordless email/magic-link sign-in. Check your email provider settings and spam folder when testing.

The SQL migration is designed to be rerunnable. If Supabase reports an SQL error, stop and fix that error before continuing; do not disable RLS as a workaround.

## 2. Get one AI API key

### Option A — Gemini (recommended default)

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Create an API key for Gemini and copy it once.
3. In Vercel, set `AI_PROVIDER=gemini` and `GEMINI_API_KEY` to this value.
4. Optional `AI_MODEL=gemini-2.5-flash`.

### Option B — OpenAI

1. Open [OpenAI API platform](https://platform.openai.com/api-keys) and create an API key with API billing/usage configured.
2. In Vercel, set `AI_PROVIDER=openai` and `OPENAI_API_KEY` to this value.
3. Optional `AI_MODEL=gpt-4.1-mini`.

Choose **one** provider. Never put the provider key in a variable beginning with `NEXT_PUBLIC_`. Monitor provider usage and set spend/usage alerts where available. Model availability and pricing are controlled by the provider and may change.

## 3. Import the GitHub repository into Vercel

1. Sign in to [Vercel](https://vercel.com/).
2. Choose **Add New → Project**.
3. Connect GitHub if prompted and import `Yashpal568/vedic-ai`.
4. Project settings:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (repository root)
   - Build Command: leave the detected default (`next build`)
   - Install Command: leave the detected default (`npm install` or the lockfile-detected equivalent)
   - Output Directory: leave blank/default; do not set `out` and do not enable static export.
5. Before clicking Deploy, expand **Environment Variables** and add the values below. Select **Production, Preview, and Development** as appropriate; for the first setup you can select all three to keep them consistent.

| Name | Value | Required? |
| --- | --- | --- |
| `AI_PROVIDER` | `gemini` or `openai` | Yes for AI replies |
| `GEMINI_API_KEY` | Google AI Studio key | Only if using Gemini |
| `OPENAI_API_KEY` | OpenAI API key | Only if using OpenAI |
| `AI_MODEL` | `gemini-2.5-flash` or `gpt-4.1-mini` | Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Required for accounts/saving |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon/publishable key | Required for accounts/saving |
| `NEXT_PUBLIC_APP_URL` | Your actual Vercel URL, including `https://` | Recommended |

For `NEXT_PUBLIC_APP_URL`, use the real production URL assigned by Vercel, for example `https://vedic-ai-your-team.vercel.app`. It is not a secret. Do not guess the Vercel subdomain—copy the URL from the Vercel project.

6. Click **Deploy** and wait for the build. Keep the deployment URL and inspect **Deployment → Build Logs** if it fails.
7. After the first deploy, return to Supabase **Authentication → URL Configuration** and replace the example Site URL/redirect placeholders with the real Vercel domain. Save the changes.
8. If you added or changed environment variables after deployment, go to **Deployments** and redeploy. Vercel applies changed variables to new deployments, not already-built deployments.

## 4. Production smoke test

Open the deployed site on desktop and mobile and test these in order:

- [ ] Home page renders with no browser console errors.
- [ ] `/api/health` responds. Check its JSON; it is a readiness snapshot, not proof that every external integration works.
- [ ] Search for a known birthplace and select the correct result/coordinates.
- [ ] Generate a chart using test data you have permission to use. Check that the API returns a chart payload and the UI renders it.
- [ ] Send a chat message. Confirm a real AI response (not a configuration/error message).
- [ ] Open `/login`, request a magic link, open the email on the same browser/device, and confirm the callback signs you in.
- [ ] Save a kundli, open `/reports`, refresh the page, and confirm the report remains.
- [ ] Save a conversation, reload, and confirm its history appears.
- [ ] Sign out; protected save/history requests should require sign-in.
- [ ] If practical, create a second test account and verify it cannot read the first account's reports or conversations.
- [ ] Check mobile navigation, keyboard use, long Hindi text, and browser console/network errors.
- [ ] Run [`supabase/tests/rls_audit.sql`](../supabase/tests/rls_audit.sql) in Supabase SQL Editor after all migrations.
- [ ] Complete the two-account ownership tests in [`docs/SECURITY_TEST_PLAN.md`](./SECURITY_TEST_PLAN.md).
- [ ] Test account deletion using a disposable test account; verify Auth user and all cascading app records are removed.
- [ ] Check the Vercel function logs for failed requests and the AI provider dashboard for usage.

## 5. Optional custom domain

1. In Vercel, open **Project → Settings → Domains** and add the domain you own.
2. Follow the exact DNS records Vercel displays at your domain registrar. Do not copy DNS values from a tutorial; they depend on the domain and configuration.
3. Wait until Vercel marks the domain as valid and HTTPS is active.
4. Update `NEXT_PUBLIC_APP_URL`, then redeploy.
5. Add `https://YOUR-CUSTOM-DOMAIN/auth/callback` to Supabase Auth Redirect URLs and set the Supabase Site URL to your preferred production domain.
6. Test magic-link login again on the custom domain.

## 6. Troubleshooting

- **Build fails:** Open the failed deployment's Build Logs. Confirm the project root is the repository root and do not force a static export. Check the latest GitHub Actions run too.
- **AI says it is not configured:** Check `AI_PROVIDER` and the matching provider key's spelling/environment scope. Redeploy after changing variables.
- **AI provider returns an error:** Confirm the key is active, billing/usage is available, the selected model is available to the account, and provider quota is not exhausted. Do not expose the key to the browser.
- **Login link returns an auth error:** The callback URL must match exactly, including protocol and path `/auth/callback`. Check Supabase Site URL, Redirect URLs, email provider, and whether the link was already used/expired.
- **Saved reports fail:** Verify both Supabase environment variables, confirm the migration ran successfully, keep RLS enabled, and check Vercel function logs.
- **Birthplace lookup fails:** Check the network response and Nominatim usage policy. The public Nominatim service is not a guaranteed high-volume production geocoder; move to a compliant provider before scaling.
- **New environment variable appears ignored:** Add it to the correct Vercel environment and redeploy.
- **Preview login does not work:** Add that exact preview callback to Supabase Redirect URLs, or test auth on the configured production domain instead.

## 7. Important before a public launch

A successful Vercel deployment means the web app built and is reachable; it does **not** certify astrological accuracy or production readiness. The current chart engine uses an approximate Lahiri ayanamsha and simplified mean lunar nodes and still needs independent comparison against trusted reference charts. The built-in rate limiter is in-memory and per serverless instance, so it is not a durable abuse-control system. Before paid or high-traffic use, add shared-store/edge rate limiting, provider quotas, monitoring/alerts, account export/deletion and retention workflows, automated RLS/security tests, and a compliant geocoding provider. Review privacy/terms and dependency licences as well.
