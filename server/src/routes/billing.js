const express = require("express");

const router = express.Router();

// ---------------------------------------------------------------------
// STUB. No payment gateway is wired up yet (Stripe doesn't operate in
// Jordan; PayTabs / HyperPay / PayPal Business were the candidates
// discussed). Once one is chosen:
//
//   1. Verify the gateway's webhook signature against `req.body` (the
//      RAW request bytes — that's why this route uses express.raw()
//      instead of express.json(), since most signature schemes are
//      computed over the exact bytes the gateway sent, not a re-
//      serialized copy of the parsed JSON). Reject with 401 on any
//      failure. Never mint a license from an unverified request.
//   2. On a genuine "payment succeeded" / "subscription active" event,
//      call `signLicense({ ref: <payer email>, days: 31 })` from
//      ../license and return the key to the payer (e.g. show it on the
//      gateway's redirect-back success page, or email it).
//
// Until then, this route does nothing but 501. For manual/offline
// payments (bank transfer, etc.) or local testing, use
// `node mint-license-cli.js` instead — see server/README.md.
// ---------------------------------------------------------------------
router.post("/webhook", express.raw({ type: "*/*" }), async (_req, res) => {
  res.status(501).json({
    error: "not_implemented",
    message: "Wire up your payment gateway's webhook verification here first — see server/README.md.",
  });
});

module.exports = router;
