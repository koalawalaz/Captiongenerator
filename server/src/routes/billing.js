const express = require("express");
const { signLicense } = require("../license");

const router = express.Router();

// ---------------------------------------------------------------------
// Gumroad integration.
//
// Gumroad's "Ping" webhook (Settings -> Advanced -> Ping) POSTs sale data
// as application/x-www-form-urlencoded on every sale — but it is NOT
// signed. Anyone who guesses this URL could POST a fake sale. So this
// route never trusts the ping body on its own: it takes the `license_key`
// and `product_permalink` the ping claims, and calls back to Gumroad's
// own License Verification API (https://api.gumroad.com/v2/licenses/verify)
// to confirm a real, unrefunded purchase actually produced that exact key.
// Only then does it mint one of *our* signed license keys via
// `signLicense()` and email it to the buyer — nothing is stored anywhere
// afterward, matching the rest of this project's no-database design.
//
// GUMROAD_VERIFY_URL defaults to Gumroad's real endpoint; it's overridable
// so a local mock server can stand in for it during testing.
// ---------------------------------------------------------------------

const GUMROAD_VERIFY_URL = process.env.GUMROAD_VERIFY_URL || "https://api.gumroad.com/v2/licenses/verify";
const LICENSE_DAYS = 31;

async function verifyGumroadLicense(productPermalink, licenseKey) {
  const body = new URLSearchParams({
    product_permalink: productPermalink,
    license_key: licenseKey,
    increment_uses_count: "false",
  });
  const resp = await fetch(GUMROAD_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await resp.json().catch(() => null);
  return { ok: resp.ok, data };
}

async function deliverLicense(email, licenseKey) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No email provider configured yet — log so a human can hand-deliver
    // it while testing. Never silently drop a minted key.
    console.log(`[billing] No RESEND_API_KEY set — license for ${email}: ${licenseKey}`);
    return { sent: false };
  }
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Your Caption Generator license key",
      text: `Thanks for upgrading! Paste this into "Have a license key?" on the site:\n\n${licenseKey}\n\nIt's valid for ${LICENSE_DAYS} days.`,
    }),
  });
  if (!resp.ok) {
    console.error(`[billing] Failed to email license to ${email}: ${resp.status} ${await resp.text().catch(() => "")}`);
    return { sent: false };
  }
  return { sent: true };
}

router.post("/gumroad-webhook", express.urlencoded({ extended: true }), async (req, res) => {
  const configuredPermalink = process.env.GUMROAD_PRODUCT_PERMALINK;
  if (!configuredPermalink) {
    console.error("[billing] GUMROAD_PRODUCT_PERMALINK is not set — refusing to mint anything.");
    return res.status(500).json({ error: "not_configured" });
  }

  const { license_key: licenseKey, product_permalink: productPermalink, email } = req.body || {};
  if (!licenseKey || !productPermalink || !email) {
    return res.status(400).json({ error: "missing_fields" });
  }
  if (productPermalink !== configuredPermalink) {
    // Not our product — ignore quietly rather than leaking configuration.
    return res.status(400).json({ error: "unknown_product" });
  }

  let verify;
  try {
    verify = await verifyGumroadLicense(productPermalink, licenseKey);
  } catch (e) {
    console.error("[billing] Gumroad verify call failed:", e);
    return res.status(502).json({ error: "verify_unreachable" });
  }

  const purchase = verify.data && verify.data.purchase;
  const isGenuine =
    verify.ok &&
    verify.data &&
    verify.data.success === true &&
    purchase &&
    !purchase.refunded &&
    !purchase.disputed &&
    !purchase.chargebacked;

  if (!isGenuine) {
    console.warn("[billing] Rejected unverified/invalid Gumroad sale claim:", verify.data);
    return res.status(401).json({ error: "unverified" });
  }

  const licenseRef = purchase.email || email;
  const ourLicenseKey = signLicense({ ref: licenseRef, days: LICENSE_DAYS });
  const delivery = await deliverLicense(licenseRef, ourLicenseKey);

  res.json({ ok: true, emailed: delivery.sent });
});

// Older placeholder route kept for other gateways / manual testing —
// see server/README.md for the offline/CLI minting path.
router.post("/webhook", express.raw({ type: "*/*" }), async (_req, res) => {
  res.status(501).json({
    error: "not_implemented",
    message: "This project's payment gateway is Gumroad — see /api/billing/gumroad-webhook.",
  });
});

module.exports = router;
