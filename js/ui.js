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
    { id:"share",     href:"share.html",     icon:"📡", label:"Berbagi File",  labelShort:"Berbagi" },
    { id:"setting",   href:"setting.html",   icon:"⚙️",  label:"Pengaturan",   labelShort:"Setelan" },
  ];

  // ── Navbar mobile ──────────────────────────────────────
  if (!document.getElementById("mobile-navbar")) {
    const mobileItems = pages.map(p => `
      <a href="${p.href}" class="mobile-nav-item ${activePage === p.id ? "active" : ""}">
        <span class="mnav-icon">${p.icon}</span>
        <span>${p.labelShort}</span>
      </a>`).join("") +
      `<button class="mobile-nav-item danger" onclick="logout()">
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
      <button class="nav-item danger" onclick="logout()">
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
(function initPageTransition() {
  document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector(".main-content");
    if (main) {
      main.classList.add("page-fade-in");
    }
  });

  // Tambah efek fade-out saat navigasi ke halaman lain
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a.nav-item, a.mobile-nav-item");
    if (!link || link.getAttribute("href") === "#") return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) return;
    e.preventDefault();
    const main = document.querySelector(".main-content");
    if (main) {
      main.style.opacity = "0";
      main.style.transform = "translateY(4px)";
      main.style.transition = "opacity 0.15s ease, transform 0.15s ease";
    }
    setTimeout(() => { window.location.href = href; }, 150);
  });
})();
