# Deploy Vedic AI to Vercel

## 1. Import the repository

1. Open Vercel and import `Yashpal568/vedic-ai` from GitHub.
2. Keep the framework preset as Next.js.
3. Use the repository root as the project root.
4. Deploy only after the latest GitHub Actions quality workflow passes.

## 2. Configure environment variables

In Vercel → Project Settings → Environment Variables, configure:

- `AI_PROVIDER`: `gemini` or `openai`
- `GEMINI_API_KEY` or `OPENAI_API_KEY`
- `AI_MODEL` (optional)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not set provider keys or the Supabase service-role key as public variables. Redeploy after changing environment variables.

## 3. Configure Supabase

1. Create a Supabase project.
2. Run the SQL migration in `supabase/migrations/202610240001_initial_schema.sql`.
3. In Auth → URL Configuration, set the production Site URL to your deployed domain.
4. Add the exact redirect URL `https://YOUR_DOMAIN/auth/callback`.
5. Configure the email provider/template and test the magic link on desktop and mobile.
6. Confirm the authenticated user can save and read their own kundli, and cannot access another user's report.

## 4. Verify deployment

- `/api/health` returns the app readiness snapshot.
- `/api/geocode` returns place candidates for a valid query.
- `/api/kundli` returns a chart payload for valid birth data and selected coordinates.
- `/api/chat` returns a helpful configuration error when the provider key is missing and a reply when configured.
- `/login` can send a magic link when Supabase is configured.
- `/reports` shows a private library for a signed-in account.
- `/api/saved-kundli` requires a valid user session.
- Run the calculation tests and compare a representative set of charts with a trusted reference before relying on chart precision.

## 5. Production considerations

Vercel serverless functions have per-instance memory, so the current geocode cache is only a small best-effort optimization. Use a compliant production geocoding provider and a durable rate-limit store before significant traffic. Configure usage alerts for the AI provider and Supabase. Review privacy policy, terms, cookie/session behavior, data deletion, and commercial licensing before public release.
