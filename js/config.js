// ============================================================
// js/config.js — Konstanta dan konfigurasi global UcupzConvert
// Import/include file ini sebelum auth.js dan ui.js
// ============================================================

/** @type {string} Google Client ID — dibaca dari meta tag yang di-inject saat build */
const GOOGLE_CLIENT_ID = document
  .querySelector('meta[name="google-client-id"]')
  ?.getAttribute("content") || "";

/**
 * Konfigurasi sesi pengguna.
 * SESSION_DURATION: lama sesi aktif dalam milidetik (default 24 jam).
 * SESSION_WARNING:  waktu sebelum expired untuk tampilkan peringatan (15 menit).
 */
const SESSION_CONFIG = {
  DURATION:      24 * 60 * 60 * 1000,   // 24 jam
  WARNING_BEFORE: 15 * 60 * 1000,        // 15 menit
  CHECK_INTERVAL:  1 * 60 * 1000,        // cek tiap 1 menit
};

/**
 * Key localStorage yang diizinkan.
 * Hanya key ini yang boleh ada — sisanya dibersihkan saat init.
 */
const STORAGE_KEYS = {
  USER:     "user",
  LOGIN_AT: "loginAt",
  PROFILE:  "profile",
  SETTINGS: "settings",
  QR_HIST:  "qr_history",
};

/**
 * Endpoint API internal (Vercel Serverless Functions).
 */
const API = {
  AUTH: "/api/auth",
};

/**
 * Nama aplikasi — dipakai di berbagai tempat agar konsisten.
 */
const APP_NAME = "UcupzConvert";
