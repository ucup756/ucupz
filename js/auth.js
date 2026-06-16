// ============================================================
// js/auth.js — Google login, verifikasi server, session, logout
// Depends: js/config.js (harus di-include lebih dulu)
// ============================================================

// ── Sanitasi input ────────────────────────────────────────

/**
 * Bersihkan string dari karakter berbahaya (XSS prevention).
 * Dipakai sebelum menyimpan data apapun dari user input.
 *
 * @param {string} str - String mentah
 * @param {number} [maxLen=200] - Panjang maksimum
 * @returns {string} String yang sudah dibersihkan
 */
function sanitizeString(str, maxLen = 200) {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .slice(0, maxLen)
    .replace(/[<>"'`]/g, "");          // hapus karakter HTML berbahaya
}

/**
 * Validasi URL — hanya izinkan http/https.
 *
 * @param {string} url
 * @returns {string} URL valid atau string kosong
 */
function sanitizeUrl(url) {
  const cleaned = sanitizeString(url, 500);
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch (_) {}
  return "";
}

// ── Storage helpers ───────────────────────────────────────

/**
 * Simpan data user ke localStorage.
 * Hanya field yang diperlukan — tidak simpan credential/token.
 *
 * @param {{ name: string, email: string, picture: string, sub: string }} user
 */
function saveUser(user) {
  const safe = {
    name:    sanitizeString(user.name,    100),
    email:   sanitizeString(user.email,   200),
    picture: sanitizeUrl(user.picture),
    sub:     sanitizeString(user.sub,      50),
  };
  localStorage.setItem(STORAGE_KEYS.USER,     JSON.stringify(safe));
  localStorage.setItem(STORAGE_KEYS.LOGIN_AT, new Date().toISOString());
}

/**
 * Ambil data user dari localStorage.
 *
 * @returns {{ name: string, email: string, picture: string, sub: string } | null}
 */
function getUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Hapus semua data sesi dari localStorage.
 */
function clearUser() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
}

/**
 * Bersihkan key localStorage yang tidak dikenal (keamanan).
 * Dipanggil satu kali saat halaman pertama dibuka.
 */
function cleanUnknownStorageKeys() {
  const allowed = new Set(Object.values(STORAGE_KEYS));
  Object.keys(localStorage).forEach(k => {
    if (!allowed.has(k)) localStorage.removeItem(k);
  });
}

// ── Session expiry ────────────────────────────────────────

/** @type {ReturnType<typeof setInterval> | null} */
let _sessionTimer = null;

/**
 * Mulai pemantauan sesi — otomatis logout setelah SESSION_CONFIG.DURATION.
 * Dipanggil sekali setelah login berhasil.
 */
function startSessionWatcher() {
  if (_sessionTimer) clearInterval(_sessionTimer);

  _sessionTimer = setInterval(() => {
    const loginAt = localStorage.getItem(STORAGE_KEYS.LOGIN_AT);
    if (!loginAt) { forceLogout("Sesi tidak ditemukan."); return; }

    const elapsed = Date.now() - new Date(loginAt).getTime();
    const remaining = SESSION_CONFIG.DURATION - elapsed;

    if (remaining <= 0) {
      forceLogout("Sesi kamu telah berakhir (24 jam). Silakan login kembali.");
      return;
    }

    // Tampilkan peringatan 15 menit sebelum expired
    if (remaining <= SESSION_CONFIG.WARNING_BEFORE) {
      const menit = Math.ceil(remaining / 60000);
      showSessionWarning(menit);
    }
  }, SESSION_CONFIG.CHECK_INTERVAL);
}

/**
 * Tampilkan banner peringatan sesi hampir habis.
 *
 * @param {number} menitTersisa
 */
function showSessionWarning(menitTersisa) {
  let banner = document.getElementById("session-warning-banner");
  if (banner) return; // sudah tampil

  banner = document.createElement("div");
  banner.id = "session-warning-banner";
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: rgba(255,179,71,0.95); color: #1a1a2e;
    font-family: var(--font-body, sans-serif); font-size: 13px; font-weight: 600;
    padding: 10px 20px; text-align: center;
    display: flex; align-items: center; justify-content: center; gap: 12px;
  `;
  banner.innerHTML = `
    <span>⚠️ Sesi kamu akan berakhir dalam ${menitTersisa} menit.</span>
    <button onclick="renewSession()" style="
      background:#1a1a2e; color:#ffb347; border:none; border-radius:6px;
      padding:4px 12px; font-size:12px; font-weight:600; cursor:pointer;
    ">Perpanjang</button>
  `;
  document.body.appendChild(banner);
}

/**
 * Perpanjang sesi dengan memperbarui timestamp loginAt.
 */
function renewSession() {
  localStorage.setItem(STORAGE_KEYS.LOGIN_AT, new Date().toISOString());
  const banner = document.getElementById("session-warning-banner");
  if (banner) banner.remove();
  showToast("Sesi berhasil diperpanjang ✓");
}

/**
 * Logout paksa karena sesi expired — redirect ke login dengan pesan.
 *
 * @param {string} pesan
 */
function forceLogout(pesan) {
  if (_sessionTimer) clearInterval(_sessionTimer);
  clearUser();
  const base = window.location.pathname.includes("/pages/") ? "../" : "";
  window.location.href = `${base}index.html?msg=${encodeURIComponent(pesan)}`;
}

// ── Google GSI callback ───────────────────────────────────

/**
 * Callback dari Google GSI setelah user berhasil login.
 * Kirim credential ke server untuk diverifikasi — TIDAK decode sendiri di browser.
 *
 * @param {{ credential: string }} response - Respons dari Google GSI
 */
async function handleLogin(response) {
  const loadingEl = document.getElementById("gsi-loading");
  if (loadingEl) {
    loadingEl.innerHTML = "Memverifikasi akun<span class='dots'></span>";
    loadingEl.style.display = "block";
  }

  try {
    const res = await fetch(API.AUTH, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ credential: response.credential }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Verifikasi gagal");
    }

    saveUser(data.user);
    cleanUnknownStorageKeys();
    window.location.href = "pages/profil.html";

  } catch (err) {
    console.error("[auth] Login gagal:", err.message);
    if (loadingEl) {
      loadingEl.innerHTML = `⚠️ Login gagal: ${err.message}`;
      loadingEl.style.color = "#ff6b6b";
    }
  }
}

// ── Proteksi halaman ──────────────────────────────────────

/**
 * Pastikan user sudah login sebelum halaman ditampilkan.
 * Jika tidak, redirect ke halaman login.
 * Jika ya, mulai session watcher dan kembalikan data user.
 *
 * @returns {{ name: string, email: string, picture: string, sub: string } | null}
 */
function requireLogin() {
  cleanUnknownStorageKeys();

  const user = getUser();
  if (!user) {
    const base = window.location.pathname.includes("/pages/") ? "../" : "";
    window.location.href = base + "index.html";
    return null;
  }

  // Cek apakah sesi sudah expired saat halaman dibuka
  const loginAt = localStorage.getItem(STORAGE_KEYS.LOGIN_AT);
  if (loginAt) {
    const elapsed = Date.now() - new Date(loginAt).getTime();
    if (elapsed > SESSION_CONFIG.DURATION) {
      forceLogout("Sesi kamu telah berakhir. Silakan login kembali.");
      return null;
    }
  }

  startSessionWatcher();
  // fillSidebarUser dipanggil SETELAH renderSidebar() di tiap halaman
  // agar elemen DOM sudah ada saat diisi
  return user;
}

/**
 * Isi elemen avatar/nama/email di sidebar dengan data user.
 *
 * @param {{ name: string, email: string, picture: string }} user
 */
function fillSidebarUser(user) {
  const avatarEl = document.getElementById("user-avatar");
  const nameEl   = document.getElementById("user-name");
  const emailEl  = document.getElementById("user-email");
  if (avatarEl) avatarEl.src = user.picture || "";
  if (nameEl)   nameEl.textContent  = user.name  || "—";
  if (emailEl)  emailEl.textContent = user.email || "—";
}

/**
 * Logout manual — konfirmasi dulu, lalu hapus sesi.
 */
function logout() {
  if (!confirm("Yakin ingin keluar?")) return;
  if (_sessionTimer) clearInterval(_sessionTimer);
  clearUser();
  const base = window.location.pathname.includes("/pages/") ? "../" : "";
  window.location.href = base + "index.html";
}

// ── Tampilkan pesan dari URL ──────────────────────────────
// (misal: setelah force logout, index.html menampilkan pesan)
(function checkLoginMessage() {
  const params = new URLSearchParams(window.location.search);
  const msg    = params.get("msg");
  if (msg && document.getElementById("gsi-loading")) {
    const el = document.getElementById("gsi-loading");
    el.style.display = "block";
    el.style.color   = "#ffb347";
    el.textContent   = msg;
    // Bersihkan URL
    history.replaceState(null, "", window.location.pathname);
  }
})();

// ── Export sanitize untuk dipakai halaman lain ────────────
// (tidak pakai ES modules agar tetap kompatibel dengan HTML biasa)
// Fungsi sanitizeString dan sanitizeUrl tersedia global.
