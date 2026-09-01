require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const usageRoutes = require("./routes/usage");
const billingRoutes = require("./routes/billing");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/billing", billingRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "not_found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Caption Generator API listening on :${PORT}`);
});
