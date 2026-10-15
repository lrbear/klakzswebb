"use strict";

const crypto = require("node:crypto");
const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");

admin.initializeApp();
const db = admin.database();
const adminEmail = defineString("KLAKZ_ADMIN_EMAIL");
const REGION = "us-central1";

function requireUser(request) {
  const user = request.auth;
  if (!user || !user.token.email || user.token.email_verified !== true) {
    throw new HttpsError("unauthenticated", "Doğrulanmış bir hesapla giriş yapmalısın.");
  }
  return user;
}

function requireAdmin(request) {
  const user = requireUser(request);
  if (String(user.token.email).toLowerCase() !== adminEmail.value().trim().toLowerCase()) {
    throw new HttpsError("permission-denied", "Bu işlem yönetici hesabı gerektiriyor.");
  }
  return user;
}

function keyHash(value) {
  return crypto.createHash("sha256").update(String(value).trim().toUpperCase()).digest("hex");
}

exports.createLicenseKey = onCall({ region: REGION, enforceAppCheck: false }, async (request) => {
  const user = requireAdmin(request);
  const days = Number(request.data && request.data.days);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new HttpsError("invalid-argument", "Anahtar süresi 1 ile 365 gün arasında olmalı.");
  }
  const token = `KLAKZ-${crypto.randomBytes(16).toString("hex").toUpperCase()}`;
  const hash = keyHash(token);
  await db.ref(`licenseKeys/${hash}`).set({ days, createdAt: Date.now(), createdBy: user.uid });
  return { key: token, days };
});

exports.redeemLicenseKey = onCall({ region: REGION, enforceAppCheck: false }, async (request) => {
  const user = requireUser(request);
  const token = String(request.data && request.data.key || "").trim();
  if (!/^KLAKZ-[A-F0-9]{32}$/i.test(token)) {
    throw new HttpsError("invalid-argument", "Anahtar biçimi geçersiz.");
  }
  const hash = keyHash(token);
  const keyRef = db.ref(`licenseKeys/${hash}`);
  const licenseRef = db.ref(`licenses/${user.uid}`);
  const days = Number((await keyRef.get()).val()?.days);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new HttpsError("failed-precondition", "Anahtar kaydı geçersiz.");
  }
  let keyRecord;
  const transaction = await keyRef.transaction((current) => {
    if (!current) return;
    if (current.usedBy && current.usedBy !== user.uid) return;
    if (!current.usedBy) {
      current.usedBy = user.uid;
      current.redeemedAt = Date.now();
    }
    return current;
  });
  keyRecord = transaction.snapshot.val();
  if (!transaction.committed || !keyRecord || keyRecord.usedBy !== user.uid) {
    throw new HttpsError("failed-precondition", "Bu anahtar geçersiz, süresi dolmuş veya daha önce kullanılmış.");
  }
  let licenseResult;
  const licenseTransaction = await licenseRef.transaction((current) => {
    const value = current || {};
    const redeemed = value.redeemedKeys || {};
    if (redeemed[hash]) return value;
    redeemed[hash] = true;
    return {
      active: true,
      expiresAt: Math.max(Date.now(), Number(value.expiresAt) || 0) + days * 86400000,
      updatedAt: Date.now(),
      redeemedKeys: redeemed
    };
  });
  licenseResult = licenseTransaction.snapshot.val();
  if (!licenseTransaction.committed || !licenseResult || !licenseResult.expiresAt) {
    throw new HttpsError("internal", "Key lisansa işlenemedi. Aynı hesapla tekrar deneyebilirsin.");
  }
  return { active: true, expiresAt: licenseResult.expiresAt };
});
