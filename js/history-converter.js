// ============================================================
// js/history-converter.js — Riwayat konversi file
// File baru, include di converter.html sebelum converter.js
// ============================================================

(function () {

  const HISTORY_KEY = "converter_history";
  const MAX_HISTORY = 20;

  // ── Style ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("conv-history-style")) return;
    const s = document.createElement("style");
    s.id = "conv-history-style";
    s.textContent = `
      /* Panel riwayat — muncul di bawah tool grid */
      #conv-history-panel {
        margin-top: 32px;
        display: none;
      }
      #conv-history-panel.show { display: block; }

      .conv-history-header {
        display: flex; align-items: center;
        justify-content: space-between; margin-bottom: 12px;
      }
      .conv-history-title {
        font-family: var(--font-head, 'Syne', sans-serif);
        font-size: 15px; font-weight: 700; color: var(--text, #eeedf8);
      }

      .conv-history-list {
        display: flex; flex-direction: column; gap: 8px;
      }

      .conv-history-item {
        display: flex; align-items: center; gap: 12px;
        background: var(--surface, #1c1c30);
        border: 1px solid var(--border, rgba(255,255,255,0.07));
        border-radius: var(--radius-sm, 9px); padding: 12px 14px;
        transition: border-color 0.18s ease, background 0.18s ease;
        animation: fileItemIn 0.22s ease both;
      }
      .conv-history-item:hover {
        border-color: var(--border2, rgba(255,255,255,0.13));
        background: var(--surface2, #22223a);
      }

      .chi-icon {
        font-size: 20px; flex-shrink: 0;
        width: 38px; height: 38px;
        display: flex; align-items: center; justify-content: center;
        background: var(--bg3, #16162a);
        border: 1px solid var(--border2, rgba(255,255,255,0.13));
        border-radius: 8px;
      }
      .chi-body { flex: 1; min-width: 0; }
      .chi-tool {
        font-size: 13px; font-weight: 600; color: var(--text, #eeedf8);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .chi-meta {
        font-size: 11px; color: var(--text3, #4a4962); margin-top: 2px;
        display: flex; gap: 8px; flex-wrap: wrap;
      }
      .chi-meta span { display: flex; align-items: center; gap: 3px; }
      .chi-badge {
        font-size: 10px; font-weight: 600; flex-shrink: 0;
        padding: 2px 8px; border-radius: 20px;
      }
      .chi-badge-pdf    { background: rgba(255,107,107,0.12); color: #ff8e8e; }
      .chi-badge-image  { background: rgba(124,106,255,0.12); color: var(--accent2, #b8abff); }
      .chi-badge-doc    { background: rgba(0,212,168,0.10);   color: var(--teal, #00d4a8); }
      .chi-open {
        background: none; border: 1px solid var(--border2, rgba(255,255,255,0.13));
        border-radius: 7px; color: var(--text2, #8887a4);
        font-family: var(--font-body, sans-serif); font-size: 11.5px; font-weight: 500;
        padding: 5px 10px; cursor: pointer; flex-shrink: 0;
        transition: all 0.18s ease; white-space: nowrap;
      }
      .chi-open:hover {
        border-color: var(--accent, #7c6aff); color: var(--accent2, #b8abff);
        background: rgba(124,106,255,0.07);
      }
      .chi-del {
        background: none; border: none; color: var(--text3, #4a4962);
        font-size: 13px; cursor: pointer; padding: 4px 6px; flex-shrink: 0;
      }
      .chi-del:hover { color: var(--danger, #ff6b6b); }

      /* Toggle tombol riwayat */
      .conv-history-toggle {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 12.5px; color: var(--text2, #8887a4);
        background: none; border: none; cursor: pointer;
        padding: 0; font-family: var(--font-body, sans-serif);
        transition: color 0.18s ease;
      }
      .conv-history-toggle:hover { color: var(--accent2, #b8abff); }

      .conv-history-empty {
        text-align: center; padding: 32px 0;
        color: var(--text3, #4a4962); font-size: 13px;
      }
      .conv-history-empty-icon {
        font-size: 32px; margin-bottom: 8px; opacity: 0.5;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Load & save history ──────────────────────────────────
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch(_) { return []; }
  }

  function saveHistory(history) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch(_) {}
  }

  // ── Tambah entri ─────────────────────────────────────────
  window.convHistoryAdd = function(toolId, toolTitle, toolIcon, inputFiles, outputDesc) {
    const history = loadHistory();
    const pdfTools   = ["merge","split","rotate","deletepages","compresspdf","watermarkpdf","passwordpdf","pdf2txt","img2pdf","pdf2img"];
    const imageTools = ["imgconvert","compress","resize","crop","rotate_img","adjust","grayscale","blur","watermarkimg","exif","base64img","mergeimg","ascii"];
    let cat = "doc";
    if (pdfTools.includes(toolId))   cat = "pdf";
    if (imageTools.includes(toolId)) cat = "image";

    const entry = {
      id:       Date.now(),
      toolId,
      tool:     toolTitle,
      icon:     toolIcon,
      cat,
      files:    inputFiles.map(f => ({ name: f.name, size: f.size })),
      output:   outputDesc,
      time:     Date.now(),
    };

    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
    saveHistory(history);
    renderHistoryPanel();
  };

  // ── Render panel ─────────────────────────────────────────
  function renderHistoryPanel() {
    const panel = document.getElementById("conv-history-panel");
    if (!panel) return;

    const history = loadHistory();

    if (!history.length) {
      panel.classList.remove("show");
      return;
    }

    panel.classList.add("show");

    const badgeClass = { pdf:"chi-badge-pdf", image:"chi-badge-image", doc:"chi-badge-doc" };
    const badgeLabel = { pdf:"PDF", image:"Gambar", doc:"Dokumen" };

    const list = history.map(item => `
      <div class="conv-history-item" id="chi-${item.id}">
        <div class="chi-icon">${item.icon}</div>
        <div class="chi-body">
          <p class="chi-tool">${escHtml(item.tool)}</p>
          <div class="chi-meta">
            <span>🕐 ${timeAgo(item.time)}</span>
            <span>📁 ${item.files.length} file</span>
            ${item.output ? `<span>→ ${escHtml(item.output)}</span>` : ""}
          </div>
        </div>
        <span class="chi-badge ${badgeClass[item.cat] || "chi-badge-doc"}">${badgeLabel[item.cat] || "Tool"}</span>
        <button class="chi-open" onclick="window.convHistoryReopen('${item.toolId}')">Buka Tool →</button>
        <button class="chi-del" onclick="window.convHistoryDelete(${item.id})" aria-label="Hapus">✕</button>
      </div>`).join("");

    const listEl = document.getElementById("conv-history-list");
    if (listEl) listEl.innerHTML = list;
  }

  // ── Reopen tool dari history ─────────────────────────────
  window.convHistoryReopen = function(toolId) {
    if (typeof openTool === "function") {
      openTool(toolId);
      if (typeof showToast === "function") showToast("Tool dibuka — unggah file baru untuk memproses");
    }
  };

  // ── Hapus entri ──────────────────────────────────────────
  window.convHistoryDelete = function(id) {
    let history = loadHistory();
    history = history.filter(h => h.id !== id);
    saveHistory(history);
    const el = document.getElementById("chi-" + id);
    if (el) {
      el.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      el.style.opacity = "0";
      el.style.transform = "translateX(12px)";
      setTimeout(() => renderHistoryPanel(), 220);
    }
  };

  // ── Hapus semua ──────────────────────────────────────────
  window.convHistoryClear = function() {
    if (!confirm("Hapus semua riwayat konversi?")) return;
    localStorage.removeItem(HISTORY_KEY);
    renderHistoryPanel();
    if (typeof showToast === "function") showToast("Riwayat dihapus ✓");
  };

  // ── Inject panel ke halaman converter ───────────────────
  function injectPanel() {
    // Cari elemen tool-grid-section untuk append panel di bawahnya
    const gridSection = document.getElementById("tool-grid-section");
    if (!gridSection || document.getElementById("conv-history-panel")) return;

    const panel = document.createElement("div");
    panel.id = "conv-history-panel";
    panel.innerHTML = `
      <div class="conv-history-header">
        <h3 class="conv-history-title">🕐 Riwayat Konversi</h3>
        <button class="btn btn-secondary" onclick="window.convHistoryClear()"
          style="font-size:11px;padding:4px 10px">Hapus Semua</button>
      </div>
      <div class="conv-history-list" id="conv-history-list"></div>
    `;
    gridSection.appendChild(panel);
    renderHistoryPanel();
  }

  // ── Utilitas ─────────────────────────────────────────────
  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1)  return "Baru saja";
    if (m < 60) return m + " menit lalu";
    if (h < 24) return h + " jam lalu";
    if (d < 7)  return d + " hari lalu";
    return new Date(ts).toLocaleDateString("id-ID", { day:"numeric", month:"short" });
  }
  function escHtml(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    injectStyles();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectPanel);
    } else {
      setTimeout(injectPanel, 100);
    }
  }

  init();

})();
