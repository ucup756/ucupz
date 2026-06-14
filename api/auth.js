// ============================================================
// api/auth.js — Verifikasi Google ID Token di server
// Vercel Serverless Function (Node.js)
//
// Endpoint: POST /api/auth
// Body:     { "credential": "<google_id_token>" }
// Response: { "ok": true, "user": { name, email, picture, sub } }
//        or { "ok": false, "error": "..." }
// ============================================================

/**
 * Verifikasi ID Token ke Google tokeninfo endpoint.
 * Lebih aman dari decode atob() di browser karena:
 * 1. Signature JWT diverifikasi oleh Google
 * 2. Client ID dicek cocok (mencegah token dari app lain)
 * 3. Expiry dicek di sisi server
 *
 * @param {string} token - Google ID Token (JWT)
 * @returns {Promise<object>} Payload token jika valid
 */
async function verifyGoogleToken(token) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID tidak dikonfigurasi di environment");
  }

  // Gunakan Google tokeninfo endpoint untuk verifikasi
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
  );

  if (!res.ok) {
    throw new Error("Token tidak valid atau sudah kadaluarsa");
  }

  const payload = await res.json();

  // Pastikan token memang ditujukan untuk app kita
  if (payload.aud !== clientId) {
    throw new Error("Token bukan untuk aplikasi ini");
  }

  // Pastikan token belum expired (Google biasanya sudah cek, double-check)
  const now = Math.floor(Date.now() / 1000);
  if (parseInt(payload.exp, 10) < now) {
    throw new Error("Token sudah kadaluarsa");
  }

  return payload;
}

/**
 * Handler utama Vercel Serverless Function.
 * Menerima POST dengan credential Google, mengembalikan data user.
 *
 * @param {import('@vercel/node').VercelRequest}  req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  // Hanya terima POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method tidak diizinkan" });
  }

  // CORS — izinkan hanya dari domain sendiri (Vercel set otomatis, ini sebagai fallback)
  res.setHeader("Access-Control-Allow-Origin", process.env.APP_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { credential } = req.body || {};

  if (!credential || typeof credential !== "string") {
    return res.status(400).json({ ok: false, error: "Credential tidak ditemukan di request body" });
  }

  try {
    const payload = await verifyGoogleToken(credential);

    // Kembalikan hanya field yang diperlukan — jangan expose full payload
    const user = {
      name:    payload.name    || "",
      email:   payload.email   || "",
      picture: payload.picture || "",
      sub:     payload.sub     || "",
    };

    return res.status(200).json({ ok: true, user });

  } catch (err) {
    console.error("[api/auth] Verifikasi gagal:", err.message);
    return res.status(401).json({ ok: false, error: err.message });
  }
}
