#!/usr/bin/env node
// Run this ONCE to create your own signing keypair. Never commit its
// output. See server/README.md for what to do with each half.
const crypto = require("crypto");

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "P-256",
});

const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
const privateB64 = Buffer.from(privatePem).toString("base64");
const publicJwk = publicKey.export({ format: "jwk" });

console.log("=".repeat(70));
console.log("PRIVATE — set as the LICENSE_PRIVATE_KEY_B64 environment variable");
console.log("on whatever mints licenses (your webhook handler / the CLI).");
console.log("Never commit this, never send it to the frontend.");
console.log("=".repeat(70));
console.log(privateB64);
console.log();
console.log("=".repeat(70));
console.log("PUBLIC — paste this into index.html's LICENSE_PUBLIC_JWK constant.");
console.log("Safe to expose; it can only verify keys, not mint them.");
console.log("=".repeat(70));
console.log(JSON.stringify(publicJwk));
