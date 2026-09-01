#!/usr/bin/env node
// Manually mint a license key — for local testing, or for handling a
// payment your gateway doesn't have a webhook for yet (a bank transfer,
// an offline invoice, etc). Requires LICENSE_PRIVATE_KEY_B64 to be set
// (see generate-keys.js).
//
// Usage:
//   node mint-license-cli.js --days 31 --ref someone@org.org
require("dotenv").config();
const { signLicense } = require("./src/license");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const days = parseInt(arg("days", "31"), 10);
const ref = arg("ref", null);

const key = signLicense({ ref, days });
console.log(key);
