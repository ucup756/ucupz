// ============================================================
// js/svg-optimizer.js — Tool SVG Optimizer
// File baru, include di converter.html sebelum converter.js
// Menambahkan tool card "SVG Optimizer" ke grid secara dinamis
// ============================================================

(function () {

  // ── Style ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("svg-opt-style")) return;
    const s = document.createElement("style");
    s.id = "svg-opt-style";
    s.textContent = `
      #svg-opt-overlay {
        position: fixed; inset: 0; z-index: 99995;
        background: rgba(8,8,15,0.80);
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        padding: 24px; opacity: 0; visibility: hidden;
        transition: opacity 0.25s ease, visibility 0.25s ease;
      }
      #svg-opt-overlay.show { opacity: 1; visibility: visible; }

      #svg-opt-card {
        background: #13132a;
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: 20px; padding: 28px;
        width: 100%; max-width: 620px;
        max-height: 90vh; overflow-y: auto;
        box-shadow: 0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,106,255,0.12);
        transform: scale(0.92) translateY(16px);
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        position: relative;
      }
      #svg-opt-overlay.show #svg-opt-card { transform: scale(1) translateY(0); }

      #svg-opt-card::before {
        content: '';
        position: absolute; top: -1px; left: 20%; right: 20%; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(124,106,255,0.6), transparent);
      }

      .svg-opt-header {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 20px;
      }
      .svg-opt-title {
        font-family: var(--font-head, 'Syne', sans-serif);
        font-size: 18px; font-weight: 700; color: var(--text, #eeedf8);
        letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px;
      }
      .svg-opt-close {
        background: none; border: none; color: var(--text3, #4a4962);
        font-size: 18px; cursor: pointer; padding: 4px 8px;
        border-radius: 6px; transition: all 0.18s ease;
      }
      .svg-opt-close:hover { color: var(--text, #eeedf8); background: rgba(255,255,255,0.06); }

      /* Upload */
      .svg-upload-zone {
        border: 2px dashed var(--border2, rgba(255,255,255,0.13));
        border-radius: 12px; padding: 32px 20px; text-align: center;
        cursor: pointer; transition: all 0.18s ease; margin-bottom: 20px;
      }
      .svg-upload-zone:hover, .svg-upload-zone.drag-over {
        border-color: var(--accent, #7c6aff);
        background: rgba(124,106,255,0.05);
      }
      .svg-upload-zone .uz-icon { font-size: 32px; margin-bottom: 8px; }
      .svg-upload-zone strong { font-size: 14px; color: var(--text, #eeedf8); display: block; margin-bottom: 4px; }
      .svg-upload-zone p { font-size: 12px; color: var(--text2, #8887a4); }

      /* Options */
      .svg-opt-options {
        background: var(--bg3, #16162a);
        border: 1px solid var(--border, rgba(255,255,255,0.07));
        border-radius: 10px; padding: 4px 16px; margin-bottom: 16px;
      }
      .svg-opt-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 11px 0; border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
        gap: 12px;
      }
      .svg-opt-row:last-child { border: none; }
      .svg-opt-row-label { font-size: 13px; font-weight: 500; color: var(--text, #eeedf8); }
      .svg-opt-row-desc  { font-size: 11px; color: var(--text2, #8887a4); margin-top: 2px; }

      /* Stats setelah optimize */
      .svg-stats {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        margin-bottom: 16px; display: none;
      }
      .svg-stats.show { display: grid; }
      .svg-stat-card {
        background: var(--surface, #1c1c30);
        border: 1px solid var(--border, rgba(255,255,255,0.07));
        border-radius: 10px; padding: 14px 12px; text-align: center;
      }
      .svg-stat-val {
        font-family: var(--font-head, 'Syne', sans-serif);
        font-size: 20px; font-weight: 700; color: var(--text, #eeedf8);
        margin-bottom: 3px;
      }
      .svg-stat-val.green { color: var(--teal, #00d4a8); }
      .svg-stat-val.accent { color: var(--accent2, #b8abff); }
      .svg-stat-lbl { font-size: 11px; color: var(--text3, #4a4962); }

      /* Preview split */
      .svg-preview-wrap {
        display: none; gap: 12px; margin-bottom: 16px;
      }
      .svg-preview-wrap.show { display: grid; grid-template-columns: 1fr 1fr; }
      .svg-preview-box {
        background: #fff;
        border-radius: 10px; padding: 12px;
        display: flex; align-items: center; justify-content: center;
        min-height: 140px; border: 1px solid var(--border2, rgba(255,255,255,0.13));
        position: relative;
      }
      .svg-preview-box svg { max-width: 100%; max-height: 140px; }
      .svg-preview-label {
        position: absolute; top: 8px; left: 8px;
        font-size: 10px; font-weight: 600;
        background: rgba(0,0,0,0.6); color: #fff;
        padding: 2px 7px; border-radius: 4px;
      }
      .svg-preview-box.error-preview {
        background: rgba(255,107,107,0.06);
        border-color: rgba(255,107,107,0.25);
        color: var(--danger, #ff6b6b); font-size: 12px; text-align: center;
      }

      /* Code diff */
      .svg-code-preview {
        background: var(--bg, #08080f);
        border: 1px solid var(--border2, rgba(255,255,255,0.13));
        border-radius: 8px; padding: 12px;
        font-family: var(--font-mono, monospace); font-size: 10.5px;
        color: var(--text2, #8887a4); line-height: 1.6;
        max-height: 140px; overflow-y: auto;
        margin-bottom: 16px; display: none; white-space: pre-wrap; word-break: break-all;
      }
      .svg-code-preview.show { display: block; }

      /* Actions */
      .svg-opt-actions { display: flex; gap: 10px; }
      .svg-btn-cancel {
        padding: 10px 18px; border-radius: 9px;
        border: 1px solid rgba(255,255,255,0.10);
        background: transparent; color: var(--text2, #8887a4);
        font-family: var(--font-body, sans-serif); font-size: 13.5px; font-weight: 500;
        cursor: pointer; transition: all 0.18s ease;
      }
      .svg-btn-cancel:hover { background: rgba(255,255,255,0.06); color: var(--text, #eeedf8); }
      .svg-btn-optimize {
        flex: 1; padding: 10px 18px; border-radius: 9px; border: none;
        background: var(--accent, #7c6aff); color: #fff;
        font-family: var(--font-body, sans-serif); font-size: 13.5px; font-weight: 600;
        cursor: pointer; transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(124,106,255,0.3);
      }
      .svg-btn-optimize:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .svg-btn-optimize:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      .svg-btn-dl {
        padding: 10px 18px; border-radius: 9px; border: none;
        background: rgba(0,212,168,0.12);
        border: 1px solid rgba(0,212,168,0.25);
        color: var(--teal, #00d4a8);
        font-family: var(--font-body, sans-serif); font-size: 13.5px; font-weight: 600;
        cursor: pointer; transition: all 0.18s ease; display: none;
      }
      .svg-btn-dl:hover { background: rgba(0,212,168,0.2); }
      .svg-btn-dl.show { display: block; }

      @media (max-width: 600px) {
        #svg-opt-card { padding: 20px 16px; border-radius: 16px; }
        .svg-preview-wrap.show { grid-template-columns: 1fr; }
        .svg-stats.show { grid-template-columns: repeat(3,1fr); gap: 6px; }
        .svg-stat-val { font-size: 16px; }
      }
    `;
    document.head.appendChild(s);
  }

  // ── State ───────────────────────────────────────────────
  let svgOriginal   = "";
  let svgOptimized  = "";
  let svgFilename   = "optimized.svg";

  // ── Inject modal ─────────────────────────────────────────
  function injectModal() {
    if (document.getElementById("svg-opt-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "svg-opt-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div id="svg-opt-card">
        <div class="svg-opt-header">
          <h2 class="svg-opt-title">
            <span style="font-size:22px">🎯</span> SVG Optimizer
          </h2>
          <button class="svg-opt-close" onclick="window.svgOptClose()">✕</button>
        </div>

        <!-- Upload zone -->
        <div class="svg-upload-zone" id="svg-upload-zone"
          onclick="document.getElementById('svg-file-input').click()">
          <div class="uz-icon">📄</div>
          <strong>Klik atau seret file SVG ke sini</strong>
          <p>Hanya file .svg yang didukung</p>
          <input type="file" id="svg-file-input" accept=".svg,image/svg+xml" style="display:none"
            onchange="window.svgOptLoad(this.files[0])" />
        </div>

        <!-- Info file -->
        <div id="svg-file-info" style="display:none;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:9px">
            <span style="font-size:20px">📄</span>
            <div style="flex:1;min-width:0">
              <p id="svg-fname" style="font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></p>
              <p id="svg-fsize" style="font-size:11px;color:var(--text3);margin-top:1px"></p>
            </div>
            <button onclick="window.svgOptReset()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;padding:4px 6px">✕</button>
          </div>
        </div>

        <!-- Options -->
        <div class="svg-opt-options" id="svg-opt-options">
          <div class="svg-opt-row">
            <div>
              <p class="svg-opt-row-label">Hapus komentar</p>
              <p class="svg-opt-row-desc"><!-- komentar --> dihapus dari SVG</p>
            </div>
            <label class="toggle"><input type="checkbox" id="opt-comments" checked /><span class="toggle-track"></span></label>
          </div>
          <div class="svg-opt-row">
            <div>
              <p class="svg-opt-row-label">Hapus metadata</p>
              <p class="svg-opt-row-desc">Tag &lt;metadata&gt;, &lt;title&gt;, &lt;desc&gt; dihapus</p>
            </div>
            <label class="toggle"><input type="checkbox" id="opt-metadata" checked /><span class="toggle-track"></span></label>
          </div>
          <div class="svg-opt-row">
            <div>
              <p class="svg-opt-row-label">Hapus atribut editor</p>
              <p class="svg-opt-row-desc">Atribut Inkscape, Illustrator, Sketch dihapus</p>
            </div>
            <label class="toggle"><input type="checkbox" id="opt-editor-attrs" checked /><span class="toggle-track"></span></label>
          </div>
          <div class="svg-opt-row">
            <div>
              <p class="svg-opt-row-label">Hapus group kosong</p>
              <p class="svg-opt-row-desc">Tag &lt;g&gt; tanpa konten atau transformasi dihapus</p>
            </div>
            <label class="toggle"><input type="checkbox" id="opt-empty-groups" checked /><span class="toggle-track"></span></label>
          </div>
          <div class="svg-opt-row">
            <div>
              <p class="svg-opt-row-label">Minifikasi angka</p>
              <p class="svg-opt-row-desc">0.50000 → .5 — persingkat angka desimal</p>
            </div>
            <label class="toggle"><input type="checkbox" id="opt-numbers" checked /><span class="toggle-track"></span></label>
          </div>
          <div class="svg-opt-row">
            <div>
              <p class="svg-opt-row-label">Hapus whitespace berlebih</p>
              <p class="svg-opt-row-desc">Spasi & newline tidak perlu dihapus</p>
            </div>
            <label class="toggle"><input type="checkbox" id="opt-whitespace" checked /><span class="toggle-track"></span></label>
          </div>
          <div class="svg-opt-row">
            <div>
              <p class="svg-opt-row-label">Persingkat warna hex</p>
              <p class="svg-opt-row-desc">#ffffff → #fff, #000000 → #000</p>
            </div>
            <label class="toggle"><input type="checkbox" id="opt-colors" checked /><span class="toggle-track"></span></label>
          </div>
          <div class="svg-opt-row">
            <div>
              <p class="svg-opt-row-label">Hapus style default</p>
              <p class="svg-opt-row-desc">Atribut yang sama dengan nilai default SVG dihapus</p>
            </div>
            <label class="toggle"><input type="checkbox" id="opt-defaults" checked /><span class="toggle-track"></span></label>
          </div>
        </div>

        <!-- Stats -->
        <div class="svg-stats" id="svg-stats">
          <div class="svg-stat-card">
            <div class="svg-stat-val" id="stat-original-size">—</div>
            <div class="svg-stat-lbl">Ukuran asli</div>
          </div>
          <div class="svg-stat-card">
            <div class="svg-stat-val green" id="stat-optimized-size">—</div>
            <div class="svg-stat-lbl">Setelah optimasi</div>
          </div>
          <div class="svg-stat-card">
            <div class="svg-stat-val accent" id="stat-saved">—</div>
            <div class="svg-stat-lbl">Ukuran berkurang</div>
          </div>
        </div>

        <!-- Preview -->
        <div class="svg-preview-wrap" id="svg-preview-wrap">
          <div class="svg-preview-box" id="svg-preview-before">
            <span class="svg-preview-label">Sebelum</span>
          </div>
          <div class="svg-preview-box" id="svg-preview-after">
            <span class="svg-preview-label">Sesudah</span>
          </div>
        </div>

        <!-- Code preview -->
        <div class="svg-code-preview" id="svg-code-preview"></div>

        <!-- Actions -->
        <div class="svg-opt-actions">
          <button class="svg-btn-cancel" onclick="window.svgOptClose()">Batal</button>
          <button class="svg-btn-optimize" id="svg-btn-optimize" onclick="window.svgOptRun()" disabled>
            🎯 Optimasi SVG
          </button>
          <button class="svg-btn-dl" id="svg-btn-dl" onclick="window.svgOptDownload()">
            ⬇ Unduh SVG
          </button>
        </div>
      </div>
    `;

    overlay.addEventListener("click", (e) => { if (e.target === overlay) window.svgOptClose(); });
    document.body.appendChild(overlay);

    // Drag drop
    const uz = document.getElementById("svg-upload-zone");
    uz.addEventListener("dragover",  e => { e.preventDefault(); uz.classList.add("drag-over"); });
    uz.addEventListener("dragleave", () => uz.classList.remove("drag-over"));
    uz.addEventListener("drop", e => {
      e.preventDefault(); uz.classList.remove("drag-over");
      const f = e.dataTransfer?.files?.[0];
      if (f) window.svgOptLoad(f);
    });
  }

  // ── Load file ────────────────────────────────────────────
  window.svgOptLoad = function(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
      if (typeof showToast === "function") showToast("Hanya file .svg yang didukung", "error");
      return;
    }

    svgFilename = file.name.replace(/\.svg$/i, "") + "_optimized.svg";
    const reader = new FileReader();
    reader.onload = (e) => {
      svgOriginal  = e.target.result;
      svgOptimized = "";

      document.getElementById("svg-upload-zone").style.display = "none";
      document.getElementById("svg-file-info").style.display   = "block";
      document.getElementById("svg-fname").textContent = file.name;
      document.getElementById("svg-fsize").textContent = fmtSize(file.size) + " · " + svgOriginal.length + " karakter";

      document.getElementById("svg-stats").classList.remove("show");
      document.getElementById("svg-preview-wrap").classList.remove("show");
      document.getElementById("svg-code-preview").classList.remove("show");
      document.getElementById("svg-btn-dl").classList.remove("show");
      document.getElementById("svg-btn-optimize").disabled = false;
      document.getElementById("svg-btn-optimize").textContent = "🎯 Optimasi SVG";
    };
    reader.readAsText(file, "utf-8");
  };

  // ── Reset ────────────────────────────────────────────────
  window.svgOptReset = function() {
    svgOriginal = svgOptimized = "";
    document.getElementById("svg-upload-zone").style.display = "block";
    document.getElementById("svg-file-info").style.display   = "none";
    document.getElementById("svg-stats").classList.remove("show");
    document.getElementById("svg-preview-wrap").classList.remove("show");
    document.getElementById("svg-code-preview").classList.remove("show");
    document.getElementById("svg-btn-dl").classList.remove("show");
    document.getElementById("svg-btn-optimize").disabled = true;
    document.getElementById("svg-file-input").value = "";
  };

  // ── Run optimizer ────────────────────────────────────────
  window.svgOptRun = function() {
    if (!svgOriginal) return;

    const opts = {
      removeComments:   document.getElementById("opt-comments")?.checked    ?? true,
      removeMetadata:   document.getElementById("opt-metadata")?.checked    ?? true,
      removeEditorAttrs:document.getElementById("opt-editor-attrs")?.checked ?? true,
      removeEmptyGroups:document.getElementById("opt-empty-groups")?.checked ?? true,
      minifyNumbers:    document.getElementById("opt-numbers")?.checked      ?? true,
      removeWhitespace: document.getElementById("opt-whitespace")?.checked   ?? true,
      shortenColors:    document.getElementById("opt-colors")?.checked       ?? true,
      removeDefaults:   document.getElementById("opt-defaults")?.checked     ?? true,
    };

    const btn = document.getElementById("svg-btn-optimize");
    btn.disabled = true;
    btn.textContent = "⏳ Mengoptimasi...";

    setTimeout(() => {
      try {
        svgOptimized = optimizeSVG(svgOriginal, opts);
        showSVGResults();
        btn.textContent = "✓ Dioptimasi — Jalankan Ulang";
        btn.disabled = false;
      } catch(e) {
        if (typeof showToast === "function") showToast("Gagal: " + e.message, "error");
        btn.disabled = false;
        btn.textContent = "🎯 Optimasi SVG";
      }
    }, 50);
  };

  // ── Core optimizer — pure JS, tanpa library ──────────────
  function optimizeSVG(svg, opts) {
    let out = svg;

    // 1. Hapus komentar
    if (opts.removeComments) {
      out = out.replace(/<!--[\s\S]*?-->/g, "");
    }

    // 2. Hapus metadata, title, desc
    if (opts.removeMetadata) {
      out = out.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
      out = out.replace(/<title[\s\S]*?<\/title>/gi, "");
      out = out.replace(/<desc[\s\S]*?<\/desc>/gi, "");
    }

    // 3. Hapus atribut editor (Inkscape, Illustrator, Sketch, Adobe)
    if (opts.removeEditorAttrs) {
      // Namespace declarations
      out = out.replace(/\s+xmlns:(inkscape|sodipodi|dc|cc|rdf|xlink|sketch|i)="[^"]*"/gi, "");
      // Atribut dengan prefix
      out = out.replace(/\s+(inkscape|sodipodi|dc|cc|rdf|sketch|i):[a-z-]+=["'][^"']*["']/gi, "");
      // Elemen Inkscape/Sodipodi
      out = out.replace(/<(sodipodi|inkscape):[^>]*\/>/gi, "");
      out = out.replace(/<(sodipodi|inkscape):[\s\S]*?<\/(sodipodi|inkscape):[^>]*>/gi, "");
      // XML processing instructions
      out = out.replace(/<\?[^>]*\?>/g, "");
      // Generator comment (Adobe, Sketch)
      out = out.replace(/generator="[^"]*"/gi, "");
      out = out.replace(/version="[^"]*"/gi, (m) => m); // keep SVG version
    }

    // 4. Hapus group kosong <g></g> atau <g/>
    if (opts.removeEmptyGroups) {
      // Beberapa iterasi untuk nested empty groups
      for (let i = 0; i < 5; i++) {
        const before = out;
        out = out.replace(/<g(\s[^>]*)?\s*>\s*<\/g>/gi, "");
        out = out.replace(/<g(\s[^>]*)?\s*\/>/gi, "");
        if (out === before) break;
      }
    }

    // 5. Minifikasi angka desimal
    if (opts.minifyNumbers) {
      // 0.5 → .5, -0.5 → -.5
      out = out.replace(/(-?)0\.(\d)/g, "$1.$2");
      // Hapus trailing zeros: 1.500 → 1.5, 1.50000 → 1.5
      out = out.replace(/(\d+\.\d*?)0+(?=\D|$)/g, "$1");
      // 1. → 1
      out = out.replace(/(\d+)\.(?=\D|$)/g, "$1");
      // Batasi presisi ke 3 desimal untuk path data
      out = out.replace(/(\d+\.\d{4,})/g, (m) => parseFloat(parseFloat(m).toFixed(3)).toString());
    }

    // 6. Hapus whitespace berlebih
    if (opts.removeWhitespace) {
      // Newline + tabs antara tag
      out = out.replace(/>\s+</g, "><");
      // Spasi berlebih dalam atribut
      out = out.replace(/\s{2,}/g, " ");
      // Spasi di awal/akhir
      out = out.trim();
      // Spasi sebelum />
      out = out.replace(/\s+\/>/g, "/>");
      // Spasi sebelum >
      out = out.replace(/\s+>/g, ">");
    }

    // 7. Persingkat warna hex
    if (opts.shortenColors) {
      // #aabbcc → #abc kalau bisa
      out = out.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, "#$1$2$3");
      // Named colors ke hex pendek yang lebih ringkas
      const colorMap = {
        "black":"#000","white":"#fff","red":"red","green":"green","blue":"blue",
        "#ffffff":"#fff","#000000":"#000","#ff0000":"red","#00ff00":"#0f0","#0000ff":"#00f",
        "#ffff00":"#ff0","#ff00ff":"#f0f","#00ffff":"#0ff",
      };
      Object.entries(colorMap).forEach(([k, v]) => {
        if (k.startsWith("#")) {
          out = out.replace(new RegExp(k.replace("#","\\#"), "gi"), v);
        }
      });
    }

    // 8. Hapus atribut default SVG
    if (opts.removeDefaults) {
      // fill="black" adalah default
      out = out.replace(/\s+fill="black"/gi, "");
      // stroke="none" adalah default
      out = out.replace(/\s+stroke="none"/gi, "");
      // fill-opacity="1" adalah default
      out = out.replace(/\s+fill-opacity="1"/gi, "");
      // opacity="1" adalah default
      out = out.replace(/\s+opacity="1"/gi, "");
      // visibility="visible" adalah default
      out = out.replace(/\s+visibility="visible"/gi, "");
      // display="inline" adalah default
      out = out.replace(/\s+display="inline"/gi, "");
      // overflow="visible" adalah default pada SVG root
      out = out.replace(/\s+overflow="visible"/gi, "");
      // xml:space="preserve" sering tidak diperlukan
      out = out.replace(/\s+xml:space="preserve"/gi, "");
    }

    return out;
  }

  // ── Tampilkan hasil ──────────────────────────────────────
  function showSVGResults() {
    const origSize = new Blob([svgOriginal]).size;
    const optSize  = new Blob([svgOptimized]).size;
    const saved    = Math.round((1 - optSize / origSize) * 100);

    // Stats
    document.getElementById("stat-original-size").textContent  = fmtSize(origSize);
    document.getElementById("stat-optimized-size").textContent = fmtSize(optSize);
    document.getElementById("stat-saved").textContent          = saved + "%";
    document.getElementById("svg-stats").classList.add("show");

    // Preview
    const beforeBox = document.getElementById("svg-preview-before");
    const afterBox  = document.getElementById("svg-preview-after");

    try {
      // Render SVG asli
      const beforeWrap = document.createElement("div");
      beforeWrap.innerHTML = svgOriginal;
      const beforeSvg = beforeWrap.querySelector("svg");
      if (beforeSvg) {
        beforeSvg.style.maxWidth = "100%";
        beforeSvg.style.maxHeight = "130px";
        // Hapus label lama
        while (beforeBox.children.length > 1) beforeBox.removeChild(beforeBox.lastChild);
        beforeBox.appendChild(beforeSvg);
        beforeBox.classList.remove("error-preview");
      }
    } catch(_) {
      beforeBox.classList.add("error-preview");
      beforeBox.innerHTML = "<span class='svg-preview-label'>Sebelum</span>Tidak bisa dirender";
    }

    try {
      // Render SVG optimized
      const afterWrap = document.createElement("div");
      afterWrap.innerHTML = svgOptimized;
      const afterSvg = afterWrap.querySelector("svg");
      if (afterSvg) {
        afterSvg.style.maxWidth = "100%";
        afterSvg.style.maxHeight = "130px";
        while (afterBox.children.length > 1) afterBox.removeChild(afterBox.lastChild);
        afterBox.appendChild(afterSvg);
        afterBox.classList.remove("error-preview");
      }
    } catch(_) {
      afterBox.classList.add("error-preview");
      afterBox.innerHTML = "<span class='svg-preview-label'>Sesudah</span>Tidak bisa dirender";
    }

    document.getElementById("svg-preview-wrap").classList.add("show");

    // Code preview (50 char pertama & terakhir untuk perbandingan)
    const codeEl = document.getElementById("svg-code-preview");
    const preview = svgOptimized.length > 500
      ? svgOptimized.slice(0, 400) + "\n\n... (" + (svgOptimized.length - 400) + " karakter lagi) ...\n\n" + svgOptimized.slice(-100)
      : svgOptimized;
    codeEl.textContent = preview;
    codeEl.classList.add("show");

    // Download button
    document.getElementById("svg-btn-dl").classList.add("show");

    if (typeof showToast === "function") {
      showToast(`SVG dioptimasi! Hemat ${saved}% (${fmtSize(origSize)} → ${fmtSize(optSize)})`);
    }

    // Catat ke riwayat konversi kalau tersedia
    if (typeof window.convHistoryAdd === "function") {
      window.convHistoryAdd(
        "svg_optimizer", "SVG Optimizer", "🎯",
        [{ name: svgFilename, size: origSize }],
        `${fmtSize(origSize)} → ${fmtSize(optSize)} (hemat ${saved}%)`
      );
    }
  }

  // ── Download ─────────────────────────────────────────────
  window.svgOptDownload = function() {
    if (!svgOptimized) return;
    const blob = new Blob([svgOptimized], { type:"image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = svgFilename;
    a.click();
    if (typeof showToast === "function") showToast("SVG diunduh ✓");
  };

  // ── Open / close ─────────────────────────────────────────
  window.svgOptOpen = function() {
    injectStyles();
    injectModal();
    window.svgOptReset();

    const overlay = document.getElementById("svg-opt-overlay");
    if (!overlay) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("show");
        document.body.style.overflow = "hidden";
      });
    });
  };

  window.svgOptClose = function() {
    const overlay = document.getElementById("svg-opt-overlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  };

  // ── Keyboard ─────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const overlay = document.getElementById("svg-opt-overlay");
      if (overlay?.classList.contains("show")) window.svgOptClose();
    }
  });

  // ── Inject tool card ke grid converter ──────────────────
  function injectToolCard() {
    // Cari grid dokumen untuk append tool card SVG di sana
    const docGrid = document.querySelector(".tool-grid[data-cat='doc']");
    if (!docGrid || docGrid.querySelector("[data-toolid='svg_optimizer']")) return;

    const card = document.createElement("div");
    card.className = "tool-card";
    card.setAttribute("data-title", "SVG Optimizer");
    card.setAttribute("data-desc", "Perkecil file SVG hapus metadata atribut editor");
    card.setAttribute("data-tags", "svg optimizer optimalkan kecil vektor gambar dokumen");
    card.setAttribute("data-toolid", "svg_optimizer");
    card.onclick = () => window.svgOptOpen();
    card.innerHTML = `
      <div class="tc-icon">🎯</div>
      <div class="tc-title">SVG Optimizer</div>
      <div class="tc-desc">Perkecil file SVG</div>
    `;
    docGrid.appendChild(card);
  }

  // ── Utilitas ─────────────────────────────────────────────
  function fmtSize(b) {
    if (b < 1024)    return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  }

  // ── Init ─────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectToolCard);
  } else {
    setTimeout(injectToolCard, 150);
  }

})();
