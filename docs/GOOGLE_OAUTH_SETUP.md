> **Current status:** Google sign-in is temporarily disabled in the login UI. Vedic AI continues to use Supabase Auth with passwordless email links. Follow this guide later when Google Cloud OAuth credentials are ready.

# Vedic AI — Google OAuth setup

The login page supports both Google OAuth and passwordless email links through Supabase Auth. Google OAuth requires one-time dashboard configuration; adding the button does not enable the provider automatically.

## 1. Configure Google as a Supabase provider

1. Open the correct Supabase project.
2. Go to **Authentication → Providers → Google** and enable Google.
3. Create or select an OAuth 2.0 Web application in Google Cloud Console.
4. In Google Cloud, add the **Supabase callback URL** shown on the Supabase Google provider page as an Authorized redirect URI. It normally has this form: `https://<project-ref>.supabase.co/auth/v1/callback`. Use the exact URL shown by your project; do not use the Vedic AI callback as the Google redirect URI.
5. Copy the Google OAuth client ID and client secret into the Supabase Google provider settings and save.
6. Complete the Google OAuth consent-screen configuration. While the app is in Testing mode, add the Google accounts that should be allowed to sign in as test users. Publish/verify the consent screen as appropriate before public launch.

## 2. Configure Supabase redirect URLs

In **Authentication → URL Configuration**:

- Set the Site URL to the actual production origin.
- Add the production callback URL, for example `https://your-domain.example/auth/callback`.
- Add the Vercel deployment callback URL if you use a stable preview domain.
- For local development, add `http://localhost:3000/auth/callback`.

Only add origins and callback paths you control. Avoid broad wildcard redirect rules in production.

## 3. Verify the flow

1. Open `/login` on the deployed site.
2. Select **Continue with Google** and finish the Google consent flow.
3. Confirm that the browser returns to `/auth/callback` and then the app home page.
4. Refresh the page and verify the session persists.
5. Verify authenticated reports, conversations, and saved data are scoped to the signed-in account.
6. Test cancel/deny, invalid provider configuration, and expired sessions; the login page should show a recoverable error.

## Important

- OAuth client secrets belong only in Google Cloud/Supabase provider configuration; never add them to source code or `NEXT_PUBLIC_*` variables.
- The app's Supabase anon/publishable key may be exposed to the browser; it is not a substitute for Row Level Security.
- A visible Google button does not prove OAuth is configured. The provider must be enabled in Supabase and the redirect allow-list must match the deployed origin.
- Do not mark Google sign-in production-ready until the deployed flow and account-isolation checks pass.
