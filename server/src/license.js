const crypto = require("crypto");

function base64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getPrivateKey() {
  const b64 = process.env.LICENSE_PRIVATE_KEY_B64;
  if (!b64) {
    throw new Error(
      "LICENSE_PRIVATE_KEY_B64 must be set — run `node generate-keys.js` once and see server/README.md"
    );
  }
  const pem = Buffer.from(b64, "base64").toString("utf8");
  return crypto.createPrivateKey(pem);
}

// Mints a signed license key: base64url(payload JSON) + "." + base64url(signature).
// `ref` is an optional free-text reference (e.g. the payer's email) — it isn't
// checked by verification, it's just for your own records if you ever need to
// look at what a key was issued for. Verification (in the browser) only checks
// the signature and `exp`.
function signLicense({ ref, days }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { ref: ref || null, iat: now, exp: now + days * 24 * 60 * 60 };
  const payloadBuf = Buffer.from(JSON.stringify(payload), "utf8");
  const signature = crypto.sign(null, payloadBuf, {
    key: getPrivateKey(),
    dsaEncoding: "ieee-p1363", // matches what the browser's Web Crypto ECDSA verify expects
  });
  return `${base64url(payloadBuf)}.${base64url(signature)}`;
}

module.exports = { signLicense };
