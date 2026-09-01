const express = require("express");
const { prisma } = require("../db");
const { authMiddleware } = require("../auth");

const router = express.Router();

// ---------------------------------------------------------------------
// STUB ONLY. No payment gateway is wired up yet (Stripe doesn't operate
// in Jordan; PayTabs / HyperPay / PayPal Business were the candidates
// discussed). This route exists so the free-tier gating logic can be
// tested end-to-end before a real gateway is chosen and integrated.
//
// It is disabled unless ALLOW_DEV_BILLING_STUB=true is set, and it must
// stay disabled (or be deleted) in any real deployment — anyone who can
// call it gets a subscription with no payment at all. Replace this
// route with your chosen gateway's checkout + webhook flow before
// charging real users. See server/README.md.
// ---------------------------------------------------------------------
router.post("/dev-simulate-upgrade", authMiddleware, async (req, res) => {
  if (process.env.ALLOW_DEV_BILLING_STUB !== "true") {
    return res.status(404).json({ error: "not_found" });
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { isSubscribed: true, subscriptionExpires: expires },
  });

  res.json({
    simulated: true,
    isSubscribed: user.isSubscribed,
    subscriptionExpires: user.subscriptionExpires,
  });
});

// Placeholder for the real gateway's webhook (subscription created/
// renewed/cancelled/payment failed). Verify the gateway's signature
// before trusting anything from this route once it's real.
router.post("/webhook", async (_req, res) => {
  res.status(501).json({ error: "not_implemented" });
});

module.exports = router;
