// ============================================================
// ui.js — Shared sidebar renderer + helpers
// ============================================================

function renderSidebar(activePage) {
  const pages = [
    { id: "profil",    href: "profil.html",    icon: "👤", label: "Profil" },
    { id: "converter", href: "converter.html", icon: "🔄", label: "Converter" },
    { id: "share",     href: "share.html",     icon: "📡", label: "Berbagi File" },
    { id: "setting",   href: "setting.html",   icon: "⚙️",  label: "Pengaturan" },
  ];

  // ── Mobile bottom navbar ──────────────────────────────────
  if (!document.getElementById("mobile-navbar")) {
    const mobileItems = pages.map(p => `
      <a href="${p.href}" class="mobile-nav-item ${activePage === p.id ? "active" : ""}">
        <span class="mnav-icon">${p.icon}</span>
        <span>${
          p.label === "Gambar to Art" ? "Art" :
          p.label === "Berbagi File"  ? "Share" :
          p.label
        }</span>
      </a>`).join("");
    const nav = document.createElement("nav");
    nav.id = "mobile-navbar";
    nav.className = "mobile-navbar";
    nav.innerHTML = mobileItems;
    document.body.appendChild(nav);
  }
  // ─────────────────────────────────────────────────────────

  const navHTML = pages.map(p => `
    <a href="${p.href}" class="nav-item ${activePage === p.id ? "active" : ""}">
      <span class="nav-icon">${p.icon}</span>
      ${p.label}
    </a>
  `).join("");

  const sidebarHTML = `
    <div class="sidebar-brand">
      <div class="brand-icon">✦</div>
      <span class="brand-name">UcupzConvert</span>
    </div>

    <p class="nav-section-label">Menu</p>

    <nav class="sidebar-nav">
      ${navHTML}
      <div style="flex:1"></div>
      <p class="nav-section-label" style="margin-top:16px">Akun</p>
      
    </nav>

    <div class="sidebar-user">
      <img id="user-avatar" src="" alt="Avatar" class="user-avatar" />
      <div class="user-info">
        <span id="user-name" class="user-name">—</span>
        <span id="user-email" class="user-email">—</span>
      </div>
    </div>
  `;

  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.innerHTML = sidebarHTML;
}

// Toast notification
function showToast(msg, type = "success") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position:fixed; bottom:28px; right:28px; z-index:9999;
      padding:12px 20px; border-radius:10px; font-size:13.5px;
      font-weight:500; opacity:0; transition:opacity 0.25s;
      max-width:300px; line-height:1.4; pointer-events:none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === "success" ? "rgba(0,212,168,0.15)" : "rgba(255,107,107,0.15)";
  toast.style.border      = `1px solid ${type === "success" ? "rgba(0,212,168,0.3)" : "rgba(255,107,107,0.3)"}`;
  toast.style.color       = type === "success" ? "#00d4a8" : "#ff6b6b";
  toast.style.opacity     = "1";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = "0"; }, 2800);
}

// ============================================================
// Settings: load & apply globally (dipanggil dari setiap halaman)
// ============================================================
function applyGlobalSettings() {
  const s = JSON.parse(localStorage.getItem("settings") || "{}");
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

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
