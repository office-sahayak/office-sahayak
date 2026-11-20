import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { verifyJagratiPassword, createJagratiSession, verifyJagratiSession, sessionSeconds } from "../lib/server/jagrati-auth.ts";

test("plot access fails closed; sessions reject tampering, expiration and password rotation", () => {
  const saved = process.env.JAGRATI_PLOT_ACCESS_HASH;
  const now = 1800000000000;
  try {
    delete process.env.JAGRATI_PLOT_ACCESS_HASH;
    assert.equal(verifyJagratiPassword("test-only-passphrase"), false);
    assert.equal(createJagratiSession(now), null);
    process.env.JAGRATI_PLOT_ACCESS_HASH = createHash("sha256").update("test-only-passphrase").digest("hex");
    assert.equal(verifyJagratiPassword("wrong"), false);
    assert.equal(verifyJagratiPassword({}), false);
    assert.equal(verifyJagratiPassword("test-only-passphrase"), true);
    const token = createJagratiSession(now);
    assert.equal(verifyJagratiSession(token, now + 1000), true);
    assert.equal(verifyJagratiSession(undefined, now), false);
    assert.equal(verifyJagratiSession(token.slice(0,-1) + (token.endsWith("0") ? "1" : "0"), now), false);
    assert.equal(verifyJagratiSession(token, now + sessionSeconds * 1000), false);
    assert.equal(verifyJagratiSession(token, now - 1000), false);
    process.env.JAGRATI_PLOT_ACCESS_HASH = createHash("sha256").update("rotated-passphrase").digest("hex");
    assert.equal(verifyJagratiSession(token, now), false);
  } finally {
    if (saved === undefined) delete process.env.JAGRATI_PLOT_ACCESS_HASH;
    else process.env.JAGRATI_PLOT_ACCESS_HASH = saved;
  }
});
