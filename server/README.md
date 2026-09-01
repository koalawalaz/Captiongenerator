# Caption Generator — license signing

There is no database, no accounts, and no user data stored anywhere in
this project. This folder is a small, stateless piece of code whose only
job is: when someone pays, sign them a license key. That's it.

## Why it works this way

The free tier (3 caption generations) and the paid tier are both enforced
entirely in the browser:

- **Free tier**: a counter in `localStorage`, on the visitor's own device.
  Nothing about them is ever sent anywhere.
- **Paid tier**: a license key the browser verifies itself. A key is a
  signed, expiring token — `base64url(payload) + "." + base64url(signature)`
  — signed with a private key that only this backend (or you, via the CLI)
  ever holds. The browser checks the signature against the matching
  *public* key (safely embedded in `index.html`) using the Web Crypto API.
  If it checks out and hasn't expired, that device is unlocked — with zero
  network calls, and nothing stored on any server.

This means an org's data (who uses the tool, what they typed, how often)
never leaves their own browser. The only thing this backend ever touches
is a payment event and the license key it produces from it — no emails,
no passwords, no usage history, nothing durable.

## One-time setup: generate your keypair

```bash
cd server
node generate-keys.js
```

This prints two things:
- A **private** key (base64-encoded) — set this as `LICENSE_PRIVATE_KEY_B64`
  wherever you deploy the webhook handler, or in your local `.env` for the
  CLI. Never commit it, never put it in frontend code.
- A **public** key (JSON) — paste this into `index.html`'s
  `CAPTION_LICENSE_PUBLIC_JWK` constant. It's safe to expose: it can verify
  keys but can't mint them.

`index.html` currently ships with a placeholder test keypair (openly
documented as such) so the redeem flow works out of the box for trying
things out. **Generate and swap in your own before accepting real
payments** — anyone who found the matching private key for the placeholder
could mint valid license keys.

## Minting a license key

**Manually** (for testing, or for a payment your gateway doesn't send a
webhook for — a bank transfer, an offline invoice, common enough in this
sector):

```bash
node mint-license-cli.js --days 31 --ref someone@org.org
```

Prints a license key to the console. Send it to whoever paid; they paste
it into the site's "Have a license key?" box.

**Automatically**, once a payment gateway is chosen: `POST /api/billing/webhook`
in `src/routes/billing.js` is a stub — it currently just returns 501. Wire
it up:

1. Verify the gateway's webhook signature against `req.body` (the route
   already uses `express.raw()` so you get the exact bytes the gateway
   signed — most signature schemes need that, not a re-serialized copy).
   **Reject anything that doesn't verify.** Never mint a license from an
   unverified request.
2. On a genuine "payment succeeded" event, call
   `signLicense({ ref: <payer email>, days: 31 })` from `../license` and
   get the key back to the payer (show it on the gateway's post-payment
   redirect page, or email it).

No payment gateway is chosen yet — Stripe doesn't operate in Jordan, and
PayTabs / HyperPay / PayPal Business were the candidates discussed.

## Running the webhook listener locally

Only needed once you're wiring up a real gateway's webhook — not needed
just to try the license/redeem flow, which works with the CLI alone.

```bash
cd server
cp .env.example .env
# edit .env: LICENSE_PRIVATE_KEY_B64 from generate-keys.js
npm install
npm run dev
```

Listens on `PORT` (default 4000).

## Deploying

Free, indefinitely — this holds no data, so there's no database tier to
expire or pay for. `render.yaml` is a ready-to-use
[Render](https://render.com) blueprint for a free web service: New →
Blueprint → point it at this repo. When it asks for
`LICENSE_PRIVATE_KEY_B64`, paste in the private key from `generate-keys.js`.

Any other Node host works too — set the same env vars from `.env.example`
and run `npm install && npm start`.

## Security notes

- Treat `LICENSE_PRIVATE_KEY_B64` like any other secret: environment
  variable only, never committed, never logged.
- The webhook route must verify the gateway's signature before minting
  anything — an unverified `POST` to that endpoint should never be able to
  produce a valid license.
- A license key, once issued, is valid until it expires — there's no way
  to revoke one early without also rotating the keypair (which invalidates
  every key issued so far, including ones people are still using). Keep
  expiry windows short (a month, matching the billing period) rather than
  issuing long-lived keys, so a leaked or disputed key ages out on its own.
