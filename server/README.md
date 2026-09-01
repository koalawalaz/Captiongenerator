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

**Automatically, via Gumroad** — chosen because it operates in Jordan
(Stripe doesn't). `POST /api/billing/gumroad-webhook` in
`src/routes/billing.js` handles it.

### One-time Gumroad setup (do this in your Gumroad dashboard)

1. Create a product — a $5/month subscription works well for this.
2. On the product's **Content** tab, enable **"Generate a unique license
   key per sale."** This is required — the webhook uses that key to
   confirm a sale is real.
3. Under **Settings → Advanced → Ping**, set the URL to
   `https://<your-deployed-server>/api/billing/gumroad-webhook`.
4. Note the product's **permalink** — the short code in its checkout URL
   (`gumroad.com/l/abcde` → `abcde`). Set it as `GUMROAD_PRODUCT_PERMALINK`
   in your deployment's environment variables.
5. Point the site's "Upgrade" button at the product: set
   `window.CAPTION_UPGRADE_URL` in `index.html` to the Gumroad checkout
   URL.

### How the webhook stays safe with no shared secret

Gumroad's Ping isn't cryptographically signed, so the handler never trusts
the ping body on its own. Instead, for every ping it calls back to
Gumroad's own [License Verification API](https://help.gumroad.com/article/76-license-keys)
with the `license_key` and `product_permalink` the ping claims. Only a
real, unrefunded sale could have produced a key Gumroad's own API confirms
— a forged POST to this endpoint can't fabricate one. The handler also
rejects anything where `product_permalink` doesn't match
`GUMROAD_PRODUCT_PERMALINK`, and anything Gumroad reports as refunded,
disputed, or charged back.

Once verified, it mints one of *this project's* signed license keys via
`signLicense({ ref: <buyer's verified email>, days: 31 })` — a separate
key from Gumroad's own, in the same ECDSA format the browser already
knows how to check.

### Delivering the key to the buyer

Set `RESEND_API_KEY` (and optionally `RESEND_FROM_EMAIL`) to email the
key automatically via [Resend](https://resend.com). Without it, the
webhook just logs the minted key to the server console — fine for
testing, or for manually forwarding it while you're getting started, but
set up email before relying on this for real sales.

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
Blueprint → point it at this repo. It'll ask for the env vars from
`.env.example` — at minimum `LICENSE_PRIVATE_KEY_B64` (from
`generate-keys.js`) and `GUMROAD_PRODUCT_PERMALINK`; add `RESEND_API_KEY`
once you're ready to email keys automatically.

Any other Node host works too — set the same env vars from `.env.example`
and run `npm install && npm start`.

## Security notes

- Treat `LICENSE_PRIVATE_KEY_B64` and `RESEND_API_KEY` like any other
  secret: environment variables only, never committed, never logged.
- The Gumroad webhook must never mint a license from the ping body alone
  — it always calls back to Gumroad's own verify API first, and rejects
  anything that API doesn't confirm as a genuine, unrefunded sale for the
  configured `GUMROAD_PRODUCT_PERMALINK`.
- A license key, once issued, is valid until it expires — there's no way
  to revoke one early without also rotating the keypair (which invalidates
  every key issued so far, including ones people are still using). Keep
  expiry windows short (a month, matching the billing period) rather than
  issuing long-lived keys, so a leaked or disputed key ages out on its own.
