# Vedic AI — branded Supabase authentication email

Use this template in **Supabase → Authentication → Email Templates → Confirm signup**. If you also use passwordless email OTP/magic links, apply the same visual template to the relevant **Magic Link** template. Supabase template variables must remain exactly as shown.

## Subject

`Confirm your email to enter Vedic AI`

## Message body (HTML)

Paste this HTML into the template editor:

```html
<div style="margin:0;padding:36px 12px;background:#10110f;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#f2efe6;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="padding:4px 0 22px;text-align:center;">
      <div style="display:inline-block;width:42px;height:42px;line-height:42px;border:1px solid #6e5b35;border-radius:13px;color:#e6cc91;font-size:22px;">☾</div>
      <div style="margin-top:10px;font-size:20px;font-weight:750;letter-spacing:-.7px;">vedic<span style="color:#d4b77a;">.</span>ai</div>
      <div style="margin-top:5px;color:#888779;font-size:10px;letter-spacing:2px;">ANCIENT INSIGHT, REIMAGINED</div>
    </div>

    <div style="padding:38px 34px 32px;border:1px solid #34342b;border-radius:20px;background:#171815;">
      <div style="color:#d4b77a;font-size:10px;font-weight:700;letter-spacing:2px;">YOUR PERSONAL JYOTISH SPACE</div>
      <h1 style="margin:16px 0 12px;color:#f2efe6;font-size:29px;line-height:1.2;letter-spacing:-.8px;">Confirm your email address</h1>
      <p style="margin:0;color:#b4b1a4;font-size:14px;line-height:1.8;">Welcome to Vedic AI. Confirm your email to securely access your personal workspace, conversations and saved kundli reports.</p>

      <div style="margin:28px 0;text-align:center;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 25px;border-radius:11px;background:#e6cc91;color:#191811;text-decoration:none;font-size:14px;font-weight:700;line-height:1.2;">Confirm email address&nbsp; →</a>
      </div>

      <p style="margin:0;color:#a6a394;font-size:12px;line-height:1.8;">If the button doesn't work, copy and paste this link into the browser where you started signing up:</p>
      <p style="margin:8px 0 0;overflow-wrap:anywhere;font-size:11px;line-height:1.7;"><a href="{{ .ConfirmationURL }}" style="color:#d4b77a;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>

      <div style="height:1px;margin:26px 0;background:#303027;"></div>
      <p style="margin:0;color:#888779;font-size:11px;line-height:1.8;">If you didn't create a Vedic AI account, you can safely ignore this email. Never share this verification link with anyone.</p>
    </div>

    <p style="margin:20px 0 0;text-align:center;color:#77776b;font-size:10px;line-height:1.8;">Traditional Jyotish, explored with curiosity—not certainty.<br/>This is an automated account-security email from Vedic AI.</p>
  </div>
</div>
```

## Critical URL configuration (fixes localhost redirects)

In **Supabase → Authentication → URL Configuration**:

1. Set **Site URL** to the actual public Vercel deployment URL, including `https://`. Do not leave it as `http://localhost:3000` for production.
2. Add the exact production redirect allowlist entry: `https://YOUR-REAL-VERCEL-DOMAIN/auth/callback`. Replace the example with the domain shown in your Vercel project.
3. If you use a custom domain, add `https://YOUR-CUSTOM-DOMAIN/auth/callback` too.
4. Keep `http://localhost:3000/auth/callback` only for local development.
5. In Vercel → Project → Settings → Environment Variables, set `NEXT_PUBLIC_APP_URL` to the same real public production URL for **Production**, then redeploy. Never enter a URL containing a verification code or other token.

Request a **new** verification email from the deployed Vercel site after saving these settings. Old emails keep the destination they were generated with; a link that already points at localhost will not be repaired by changing settings later. The local link in a development email can only work while the local server is running.

## Why the callback route matters

The application requests `/auth/callback` and exchanges the one-time `code` for a Supabase session. The production domain must allow that exact path. A URL such as `http://localhost:3000/?code=...` means the email was generated with a localhost/root redirect (or an old template/configuration); it is not the correct production callback. Do not copy, share, or post verification URLs because they contain sensitive one-time credentials.
