# Caption Generator API

A small backend for the Caption Generator's paid tier: email/password
accounts, and usage tracking for the free-tier limit (3 caption
generations, then a $5/month subscription for unlimited).

## Stack

Node.js + Express, PostgreSQL via Prisma, bcrypt-hashed passwords, JWT
session tokens (sent as a `Bearer` header — no cookies, so it works from a
static frontend hosted on a different origin, including the Claude
artifact).

## Endpoints

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create an account. Body: `{email, password}` (password ≥ 8 chars). |
| POST | `/api/auth/login` | — | Log in. Body: `{email, password}`. |
| GET | `/api/auth/me` | ✓ | Current account's email and subscription state. |
| GET | `/api/usage/status` | ✓ | Free generations used/remaining, subscription state. |
| POST | `/api/usage/generate` | ✓ | Call once per "Generate my captions" click. Increments the free-tier counter, or 402s once it's used up and the account isn't subscribed. |
| POST | `/api/billing/dev-simulate-upgrade` | ✓ | **Dev/test only** — see below. |
| POST | `/api/billing/webhook` | — | Placeholder for a real payment gateway's webhook. Currently returns 501. |

## Running locally

Needs a PostgreSQL database.

```bash
cd server
cp .env.example .env
# edit .env: set DATABASE_URL to your local Postgres, and JWT_SECRET to
# something random (the .env.example comment shows a one-liner for that)
npm install
npx prisma migrate deploy   # or: npx prisma migrate dev, if iterating on the schema
npm run dev
```

The API listens on `PORT` (default 4000). Point the frontend at it by
setting `window.CAPTION_API_BASE` before `script.js` loads (see
`index.html`), or by editing the default in that same script tag.

## Deploying for free, with no expiration date

Render's own free Postgres tier expires after about 30 days, so the
database and the API are hosted separately: a free **Neon** Postgres
database (no time limit — it pauses when idle and wakes back up on the
next connection, it doesn't get deleted) plus a free **Render** web
service for the API.

**1. Create the database on [neon.tech](https://neon.tech)** (free, no
card required): sign up, create a project, and copy the connection string
it gives you (starts with `postgresql://...`).

**2. Deploy the API on [Render](https://render.com)**: New → Blueprint →
point it at this repo. Render reads `render.yaml` and sets up the web
service; when it asks for `DATABASE_URL` (marked "set during deploy"),
paste in the Neon connection string from step 1. `JWT_SECRET` is
generated for you automatically.

Any other Node host works too (a plain VPS, Fly.io) — just set the same
environment variables from `.env.example` (using your Neon connection
string for `DATABASE_URL`) and run
`npm install && npx prisma migrate deploy && npm start`.

After deploying, update `window.CAPTION_API_BASE` in `index.html` (and in
the combined single-file build used for the Claude artifact) to your
backend's real URL, and set `CORS_ORIGIN` on the backend to the exact
origin(s) the frontend is served from.

## Billing: this is a stub, not a real payment integration

**No payment gateway is wired up.** Stripe doesn't operate in Jordan, and
a replacement (PayTabs, HyperPay, and PayPal Business were the candidates
discussed) hasn't been chosen yet. `POST /api/billing/dev-simulate-upgrade`
exists only so the free-tier limit and the rest of the account flow could
be built and tested end-to-end before that decision is made — it marks the
calling account as subscribed with **no payment of any kind**.

That route is disabled unless the `ALLOW_DEV_BILLING_STUB` environment
variable is exactly `"true"`. **Leave it unset (or `"false"`) in any real
deployment** — anyone who can call the route while it's enabled gets a free
subscription. The frontend's "Upgrade" button already handles both cases
honestly: with the stub enabled it shows a dialog explicitly saying no real
payment was made; with it disabled (the default) it tells the viewer that
online upgrades aren't set up yet, rather than pretending to charge them.

### Wiring in a real gateway later

Once a gateway is chosen:

1. Replace `dev-simulate-upgrade` with that gateway's real checkout flow
   (a hosted payment page or their JS SDK), and remove the stub route
   entirely.
2. Implement `POST /api/billing/webhook` for real: verify the gateway's
   signature on every request, then set `isSubscribed` /
   `subscriptionExpires` on the `User` row from the subscription-created /
   renewed / cancelled / payment-failed events it sends — don't rely on the
   client telling you payment succeeded.
3. Store whatever the gateway needs to manage the subscription later (a
   customer ID, a subscription ID) as new columns on `User` via a Prisma
   migration.
4. Keep secrets (API keys, webhook signing secret) in environment
   variables only — never commit them, never send them to the frontend.

## Security notes (minimal-scope tradeoffs)

This is intentionally minimal, matching what was asked for. Before this
handles real money or real user data at scale, consider:

- **Rate limiting** login and signup (currently unlimited attempts).
- **Email verification and password reset** (currently neither exists —
  losing your password means losing the account).
- **httpOnly cookies instead of a bearer token in `localStorage`** for
  session storage, which is more resistant to XSS token theft (this needs
  `SameSite=None; Secure` cookies and `credentials: true` CORS since the
  frontend and backend are on different origins).
- A managed auth provider (Auth0, Clerk, Supabase Auth) if you'd rather not
  maintain password hashing and session handling yourselves.
