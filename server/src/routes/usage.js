const express = require("express");
const { prisma } = require("../db");
const { authMiddleware } = require("../auth");

const router = express.Router();

const FREE_LIMIT = 3;

function hasActiveAccess(user) {
  if (!user.isSubscribed) return false;
  if (!user.subscriptionExpires) return true;
  return user.subscriptionExpires.getTime() > Date.now();
}

function usageStatus(user) {
  const subscribed = hasActiveAccess(user);
  return {
    freeGenerationsUsed: user.freeGenerationsUsed,
    freeLimit: FREE_LIMIT,
    freeRemaining: Math.max(0, FREE_LIMIT - user.freeGenerationsUsed),
    isSubscribed: subscribed,
    canGenerate: subscribed || user.freeGenerationsUsed < FREE_LIMIT,
  };
}

router.get("/status", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json(usageStatus(user));
});

// Call once per "Generate captions" click. Free users are limited to
// FREE_LIMIT total generations; regenerating phrasing for an already
// generated story does not need to call this again.
router.post("/generate", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "not_found" });

  const status = usageStatus(user);
  if (!status.canGenerate) {
    return res.status(402).json({ error: "free_limit_reached", ...status });
  }

  if (status.isSubscribed) {
    return res.json(status);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { freeGenerationsUsed: { increment: 1 } },
  });
  res.json(usageStatus(updated));
});

module.exports = router;
