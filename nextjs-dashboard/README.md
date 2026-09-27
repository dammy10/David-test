## Next.js App Router Course - Starter

This is the starter template for the Next.js App Router Course. It contains the starting code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.

## OAuth sign-in

Email and password sign-in remains available. GitHub and Google sign-in are
enabled when their OAuth client ID and secret are configured.
Social sign-in creates a dashboard account on the first sign-in using the
provider's verified email. GitHub and Google emails must be verified. A
random password is generated for OAuth-only accounts, which can still use
OAuth to sign in:

| Provider | Environment variables | Callback URL |
| --- | --- | --- |
| GitHub | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | `/api/auth/callback/github` |
| Google | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | `/api/auth/callback/google` |

Register each callback URL with the provider using both the local origin
(`http://localhost:3000`) and the deployed origin. Add the matching environment
variables to the local `.env` file and the Vercel project settings, then restart
or redeploy the app. The provider buttons remain disabled until both variables
for that provider are configured.
