const express = require("express");
const { prisma } = require("../db");
const { hashPassword, verifyPassword, signToken, authMiddleware } = require("../auth");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return {
    email: user.email,
    freeGenerationsUsed: user.freeGenerationsUsed,
    isSubscribed: user.isSubscribed,
    subscriptionExpires: user.subscriptionExpires,
  };
}

router.post("/signup", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "invalid_email" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "password_too_short" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "email_taken" });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  const token = signToken(user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const token = signToken(user.id);
  res.json({ token, user: publicUser(user) });
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json({ user: publicUser(user) });
});

module.exports = router;
