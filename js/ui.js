// ============================================================
// js/ui.js — Sidebar, navbar mobile, toast, settings global
// Depends: js/config.js
// ============================================================

/**
 * Render sidebar navigasi desktop dan navbar mobile.
 * Dipanggil sekali di tiap halaman app setelah requireLogin().
 * @param {string} activePage - 'profil'|'converter'|'qrcode'|'share'|'setting'
 */
function renderSidebar(activePage) {
  const pages = [
    { id:"profil",    href:"profil.html",    icon:"👤", label:"Profil",        labelShort:"Profil" },
    { id:"converter", href:"converter.html", icon:"🔄", label:"Converter",     labelShort:"Convert" },
    { id:"qrcode",    href:"qrcode.html",    icon:"📲", label:"QR Code",       labelShort:"QR" },
   /** { id:"share",     href:"share.html",     icon:"📡", label:"Berbagi File",  labelShort:"Berbagi" }, */
    { id:"setting",   href:"setting.html",   icon:"⚙️",  label:"Pengaturan",   labelShort:"Setelan" },
  ];

  // ── Navbar mobile ──────────────────────────────────────
  if (!document.getElementById("mobile-navbar")) {
    const mobileItems = pages.map(p => `
      <a href="${p.href}" class="mobile-nav-item ${activePage === p.id ? "active" : ""}">
        <span class="mnav-icon">${p.icon}</span>
        <span>${p.labelShort}</span>
      </a>`).join("") +
      `<button class="mobile-nav-item danger" onclick="showLogoutModal()">
        <span class="mnav-icon">🚪</span><span>Keluar</span>
      </button>`;
    const nav = document.createElement("nav");
    nav.id = "mobile-navbar";
    nav.className = "mobile-navbar";
    nav.setAttribute("aria-label", "Navigasi utama");
    nav.innerHTML = mobileItems;
    document.body.appendChild(nav);
  }

  // ── Sidebar desktop ────────────────────────────────────
  const navHTML = pages.map(p => `
    <a href="${p.href}" class="nav-item ${activePage === p.id ? "active" : ""}"
       aria-current="${activePage === p.id ? "page" : "false"}">
      <span class="nav-icon" aria-hidden="true">${p.icon}</span>
      ${p.label}
    </a>`).join("");

  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <div class="brand-icon" aria-hidden="true">✦</div>
      <span class="brand-name">${APP_NAME}</span>
    </div>

    <p class="nav-section-label">Menu</p>

    <nav class="sidebar-nav" aria-label="Menu navigasi">
      ${navHTML}
      <div style="flex:1"></div>
      <p class="nav-section-label" style="margin-top:16px">Akun</p>
      <button class="nav-item danger" onclick="showLogoutModal()">
        <span class="nav-icon" aria-hidden="true">🚪</span>
        Keluar
      </button>
    </nav>

    <div class="sidebar-user" role="status" aria-label="Info pengguna">
      <img id="user-avatar" src="" alt="Avatar pengguna" class="user-avatar" />
      <div class="user-info">
        <span id="user-name" class="user-name">—</span>
        <span id="user-email" class="user-email">—</span>
      </div>
    </div>
  `;

  // Isi data user setelah elemen sidebar ada di DOM
  const _u = getUser();
  if (_u) fillSidebarUser(_u);

  // Inject modal logout (sekali saja)
  _injectLogoutModal();
}

// ── Modal Logout ──────────────────────────────────────────

/**
 * Inject HTML & style modal logout ke <body>.
 * Dipanggil otomatis oleh renderSidebar(), hanya sekali.
 */
function _injectLogoutModal() {
  if (document.getElementById("logout-modal-overlay")) return;

  // Style
  const style = document.createElement("style");
  style.textContent = `
    #logout-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 99998;
      background: rgba(8, 8, 15, 0.75);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.22s ease, visibility 0.22s ease;
    }
    #logout-modal-overlay.show {
      opacity: 1;
      visibility: visible;
    }

    #logout-modal-card {
      background: #13132a;
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 20px;
      padding: 36px 32px 28px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      position: relative;
      box-shadow:
        0 32px 64px rgba(0, 0, 0, 0.55),
        0 0 0 1px rgba(124, 106, 255, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      transform: scale(0.88) translateY(16px);
      transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #logout-modal-overlay.show #logout-modal-card {
      transform: scale(1) translateY(0);
    }

    #logout-modal-card::before {
      content: '';
      position: absolute;
      top: -1px; left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(124,106,255,0.6), transparent);
    }

    .logout-modal-icon {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: rgba(255, 107, 107, 0.10);
      border: 1px solid rgba(255, 107, 107, 0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 20px;
      box-shadow: 0 0 24px rgba(255, 107, 107, 0.12);
    }

    .logout-modal-title {
      font-family: var(--font-head, 'Syne', sans-serif);
      font-size: 20px;
      font-weight: 700;
      color: var(--text, #eeedf8);
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    .logout-modal-desc {
      font-size: 13.5px;
      color: var(--text2, #8887a4);
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .logout-modal-user {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 24px;
      text-align: left;
    }
    .logout-modal-user img {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255,255,255,0.10);
      flex-shrink: 0;
    }
    .logout-modal-user-info {
      flex: 1;
      min-width: 0;
    }
    .logout-modal-user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text, #eeedf8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .logout-modal-user-email {
      font-size: 11px;
      color: var(--text3, #4a4962);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }

    .logout-modal-actions {
      display: flex;
      gap: 10px;
    }

    .logout-btn-cancel {
      flex: 1;
      padding: 11px 16px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05);
      color: var(--text2, #8887a4);
      font-family: var(--font-body, 'DM Sans', sans-serif);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.18s ease;
    }
    .logout-btn-cancel:hover {
      background: rgba(255,255,255,0.09);
      color: var(--text, #eeedf8);
    }

    .logout-btn-confirm {
      flex: 1;
      padding: 11px 16px;
      border-radius: 10px;
      border: none;
      background: rgba(255, 107, 107, 0.15);
      color: #ff6b6b;
      font-family: var(--font-body, 'DM Sans', sans-serif);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
      box-shadow: 0 0 0 1px rgba(255,107,107,0.25);
      position: relative;
      overflow: hidden;
    }
    .logout-btn-confirm::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255,107,107,0.08);
      opacity: 0;
      transition: opacity 0.18s ease;
    }
    .logout-btn-confirm:hover {
      background: rgba(255, 107, 107, 0.25);
      box-shadow: 0 0 0 1px rgba(255,107,107,0.45), 0 4px 20px rgba(255,107,107,0.18);
      transform: translateY(-1px);
      color: #ff8e8e;
    }
    .logout-btn-confirm:hover::before { opacity: 1; }
    .logout-btn-confirm:active { transform: translateY(0); }

    @media (max-width: 400px) {
      #logout-modal-card { padding: 28px 20px 22px; }
      .logout-modal-actions { flex-direction: column-reverse; }
    }
  `;
  document.head.appendChild(style);

  // HTML modal
  const overlay = document.createElement("div");
  overlay.id = "logout-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "logout-modal-title-el");
  overlay.innerHTML = `
    <div id="logout-modal-card">
      <div class="logout-modal-icon">🚪</div>
      <p class="logout-modal-title" id="logout-modal-title-el">Keluar dari akun?</p>
      <p class="logout-modal-desc">
        Sesi kamu akan dihapus dan kamu perlu<br>masuk kembali dengan Google.
      </p>
      <div class="logout-modal-user" id="logout-modal-user-row">
        <img id="logout-modal-avatar" src="" alt="" />
        <div class="logout-modal-user-info">
          <p class="logout-modal-user-name" id="logout-modal-uname">—</p>
          <p class="logout-modal-user-email" id="logout-modal-uemail">—</p>
        </div>
      </div>
      <div class="logout-modal-actions">
        <button class="logout-btn-cancel" onclick="hideLogoutModal()">Batal</button>
        <button class="logout-btn-confirm" onclick="_confirmLogout()">Ya, Keluar</button>
      </div>
    </div>
  `;

  // Tutup saat klik overlay (bukan card-nya)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideLogoutModal();
  });

  document.body.appendChild(overlay);

  // Tutup dengan Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("show")) {
      hideLogoutModal();
    }
  });
}

/**
 * Tampilkan modal konfirmasi logout.
 * Mengisi data user (nama, email, avatar) secara otomatis.
 */
function showLogoutModal() {
  const overlay = document.getElementById("logout-modal-overlay");
  if (!overlay) return;

  // Isi data user ke modal
  const u = getUser();
  if (u) {
    const avatarEl = document.getElementById("logout-modal-avatar");
    const nameEl   = document.getElementById("logout-modal-uname");
    const emailEl  = document.getElementById("logout-modal-uemail");
    if (avatarEl) avatarEl.src = u.picture || "";
    if (nameEl)   nameEl.textContent  = u.name  || "—";
    if (emailEl)  emailEl.textContent = u.email || "—";
  }

  overlay.classList.add("show");
  document.body.style.overflow = "hidden";

  // Fokus ke tombol Batal (aksesibilitas)
  setTimeout(() => {
    const cancelBtn = overlay.querySelector(".logout-btn-cancel");
    if (cancelBtn) cancelBtn.focus();
  }, 50);
}

/**
 * Sembunyikan modal logout.
 */
function hideLogoutModal() {
  const overlay = document.getElementById("logout-modal-overlay");
  if (!overlay) return;
  overlay.classList.remove("show");
  document.body.style.overflow = "";
}

/**
 * Eksekusi logout setelah konfirmasi di modal.
 * @private
 */
function _confirmLogout() {
  hideLogoutModal();
  // Sedikit delay agar animasi tutup modal terlihat dulu
  setTimeout(() => {
    if (typeof _sessionTimer !== "undefined" && _sessionTimer) clearInterval(_sessionTimer);
    clearUser();
    const base = window.location.pathname.includes("/pages/") ? "../" : "";
    window.location.href = base + "index.html";
  }, 180);
}

/**
 * Logout manual — sekarang tampilkan modal, bukan confirm().
 * Fungsi ini tetap dipertahankan agar kompatibel dengan kode
 * di profil.html yang memanggil logout() langsung.
 */
function logout() {
  showLogoutModal();
}

// ── Toast notification ────────────────────────────────────

/**
 * Tampilkan notifikasi toast sementara.
 * @param {string} msg   - Pesan yang ditampilkan
 * @param {'success'|'error'} [type='success'] - Tipe toast
 */
function showToast(msg, type = "success") {
  let toast = document.getElementById("toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText = [
      "position:fixed","bottom:28px","right:28px","z-index:9999",
      "padding:12px 20px","border-radius:10px","font-size:13.5px",
      "font-weight:500","opacity:0","transition:opacity 0.25s",
      "max-width:300px","line-height:1.4","pointer-events:none",
      "font-family:var(--font-body,sans-serif)",
    ].join(";");
    document.body.appendChild(toast);
  }

  const isSuccess = type === "success";
  toast.textContent = msg;
  toast.style.background = isSuccess ? "rgba(0,212,168,0.15)"   : "rgba(255,107,107,0.15)";
  toast.style.border      = isSuccess ? "1px solid rgba(0,212,168,0.3)" : "1px solid rgba(255,107,107,0.3)";
  toast.style.color       = isSuccess ? "#00d4a8"                : "#ff6b6b";
  toast.style.opacity     = "1";

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = "0"; }, 2800);
}

// ── Terapkan pengaturan global ────────────────────────────

/**
 * Terapkan pengaturan tampilan dari localStorage (tema, font, animasi).
 * Dipanggil di setiap halaman app setelah renderSidebar().
 */
function applyGlobalSettings() {
  let s = {};
  try {
    s = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || "{}");
  } catch(_) {}

  if (s.accent) {
    document.documentElement.style.setProperty("--accent", s.accent);
    document.documentElement.style.setProperty("--accent-glow", hexToRgba(s.accent, 0.28));
  }
  if (s.fontSize) {
    document.documentElement.style.fontSize = s.fontSize + "px";
  }
  if (s.anim === false) {
    document.documentElement.style.setProperty("--transition", "0s");
  } else {
    document.documentElement.style.setProperty("--transition", "0.18s cubic-bezier(0.4,0,0.2,1)");
  }
  if (s.darkMode === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

/**
 * Konversi HEX warna ke string rgba().
 * @param {string} hex   - Warna hex mis: '#7c6aff'
 * @param {number} alpha - Nilai alpha 0–1
 * @returns {string}
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Animasi transisi halaman ──────────────────────────────

/**
 * Tambahkan kelas fade-in ke elemen .main-content saat halaman dimuat.
 * Dipanggil otomatis saat script dimuat.
 */
// ============================================================
// ui-transition-patch.js
// Ganti fungsi initPageTransition() di js/ui.js
// dengan versi di bawah ini (lebih halus, slide + fade)
// ============================================================

(function initPageTransition() {

  // Fade-in saat halaman pertama dimuat
  document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector(".main-content");
    if (main) main.classList.add("page-fade-in");
  });

  // Intercept klik navigasi — animasi fade+slide keluar, lalu pindah halaman
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a.nav-item, a.mobile-nav-item");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href === "#" || href.startsWith("http")) return;

    // Jangan intercept kalau sudah di halaman yang sama
    const currentPath = window.location.pathname;
    const targetPath  = new URL(href, window.location.href).pathname;
    if (currentPath === targetPath) return;

    e.preventDefault();

    const main = document.querySelector(".main-content");
    if (main) {
      main.style.transition = "opacity 0.18s ease, transform 0.18s ease";
      main.style.opacity    = "0";
      main.style.transform  = "translateY(8px)";
    }

    // Sidebar: dim sedikit saat navigasi
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.style.transition = "opacity 0.18s ease";
      sidebar.style.opacity    = "0.6";
    }

    setTimeout(() => { window.location.href = href; }, 180);
  });

})();
