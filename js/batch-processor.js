// ============================================================
// js/batch-processor.js — Batch processing gambar
// File baru, include di converter.html sebelum converter.js
// ============================================================

(function () {

  // ── State ───────────────────────────────────────────────
  let batchFiles   = [];
  let batchMode    = "compress"; // compress | resize | convert
  let batchRunning = false;

  // ── Style ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("batch-style")) return;
    const s = document.createElement("style");
    s.id = "batch-style";
    s.textContent = `
      #batch-modal-overlay {
        position: fixed; inset: 0; z-index: 99996;
        background: rgba(8,8,15,0.80);
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        padding: 24px; opacity: 0; visibility: hidden;
        transition: opacity 0.25s ease, visibility 0.25s ease;
      }
      #batch-modal-overlay.show { opacity: 1; visibility: visible; }

      #batch-modal-card {
        background: #13132a;
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: 20px;
        padding: 28px 28px 24px;
        width: 100%; max-width: 560px;
        max-height: 90vh; overflow-y: auto;
        box-shadow: 0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,106,255,0.12);
        transform: scale(0.92) translateY(16px);
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        position: relative;
      }
      #batch-modal-overlay.show #batch-modal-card {
        transform: scale(1) translateY(0);
      }
      #batch-modal-card::before {
        content: '';
        position: absolute; top: -1px; left: 20%; right: 20%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(124,106,255,0.6), transparent);
      }

      .batch-header {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 20px;
      }
      .batch-title {
        font-family: var(--font-head, 'Syne', sans-serif);
        font-size: 18px; font-weight: 700; color: var(--text, #eeedf8);
        letter-spacing: -0.02em;
      }
      .batch-close {
        background: none; border: none; color: var(--text3, #4a4962);
        font-size: 18px; cursor: pointer; padding: 4px 8px;
        border-radius: 6px; transition: all 0.18s ease;
      }
      .batch-close:hover { color: var(--text, #eeedf8); background: rgba(255,255,255,0.06); }

      /* Mode tabs */
      .batch-mode-tabs {
        display: flex; gap: 6px; margin-bottom: 20px;
        background: var(--bg3, #16162a);
        border: 1px solid var(--border, rgba(255,255,255,0.07));
        border-radius: 10px; padding: 4px;
      }
      .batch-mode-tab {
        flex: 1; padding: 8px 0; border: none; border-radius: 7px;
        background: transparent; color: var(--text2, #8887a4);
        font-family: var(--font-body, sans-serif); font-size: 13px; font-weight: 500;
        cursor: pointer; transition: all 0.18s ease; text-align: center;
      }
      .batch-mode-tab.active {
        background: var(--surface, #1c1c30); color: var(--text, #eeedf8);
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      }

      /* Upload zone batch */
      .batch-upload-zone {
        border: 2px dashed var(--border2, rgba(255,255,255,0.13));
        border-radius: 12px; padding: 28px 20px; text-align: center;
        cursor: pointer; transition: all 0.18s ease; margin-bottom: 16px;
      }
      .batch-upload-zone:hover, .batch-upload-zone.drag-over {
        border-color: var(--accent, #7c6aff);
        background: rgba(124,106,255,0.05);
      }
      .batch-upload-zone p { font-size: 13px; color: var(--text2, #8887a4); margin-top: 6px; }
      .batch-upload-zone strong { color: var(--text, #eeedf8); font-size: 14px; }

      /* Options */
      .batch-option-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 0; border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
        gap: 12px; flex-wrap: wrap;
      }
      .batch-option-row:last-of-type { border: none; }
      .batch-opt-label { font-size: 13px; font-weight: 500; color: var(--text, #eeedf8); }
      .batch-opt-desc  { font-size: 11px; color: var(--text2, #8887a4); margin-top: 2px; }

      /* File queue list */
      .batch-file-queue {
        display: flex; flex-direction: column; gap: 6px;
        max-height: 200px; overflow-y: auto;
        margin-bottom: 16px; padding-right: 2px;
      }
      .batch-file-item {
        display: flex; align-items: center; gap: 10px;
        background: var(--bg3, #16162a);
        border: 1px solid var(--border, rgba(255,255,255,0.07));
        border-radius: 8px; padding: 8px 12px;
        transition: border-color 0.18s ease;
      }
      .batch-file-item.done    { border-color: rgba(0,212,168,0.3); }
      .batch-file-item.failed  { border-color: rgba(255,107,107,0.3); }
      .batch-file-item.running { border-color: rgba(124,106,255,0.3); }
      .bfi-icon { font-size: 16px; flex-shrink: 0; }
      .bfi-name { flex: 1; font-size: 12px; font-weight: 500; color: var(--text, #eeedf8);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bfi-size { font-size: 11px; color: var(--text3, #4a4962); flex-shrink: 0; }
      .bfi-status { font-size: 11px; flex-shrink: 0; min-width: 56px; text-align: right; }
      .bfi-del {
        background: none; border: none; color: var(--text3, #4a4962);
        cursor: pointer; font-size: 13px; padding: 2px 4px; flex-shrink: 0;
      }
      .bfi-del:hover { color: var(--danger, #ff6b6b); }

      /* Progress overall */
      .batch-overall-progress {
        margin-bottom: 16px; display: none;
      }
      .batch-overall-bar {
        height: 6px; background: var(--surface2, #22223a);
        border-radius: 6px; overflow: hidden; margin-bottom: 6px;
      }
      .batch-overall-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent, #7c6aff), var(--teal, #00d4a8));
        border-radius: 6px;
        transition: width 0.3s ease;
        width: 0%;
      }
      .batch-overall-text {
        font-size: 12px; color: var(--text2, #8887a4); text-align: center;
      }

      /* Actions */
      .batch-actions { display: flex; gap: 10px; margin-top: 4px; }
      .batch-btn-cancel {
        padding: 10px 18px; border-radius: 9px;
        border: 1px solid rgba(255,255,255,0.10);
        background: transparent; color: var(--text2, #8887a4);
        font-family: var(--font-body, sans-serif); font-size: 13.5px; font-weight: 500;
        cursor: pointer; transition: all 0.18s ease;
      }
      .batch-btn-cancel:hover { background: rgba(255,255,255,0.06); color: var(--text, #eeedf8); }
      .batch-btn-run {
        flex: 1; padding: 10px 18px; border-radius: 9px; border: none;
        background: var(--accent, #7c6aff); color: #fff;
        font-family: var(--font-body, sans-serif); font-size: 13.5px; font-weight: 600;
        cursor: pointer; transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(124,106,255,0.3);
      }
      .batch-btn-run:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .batch-btn-run:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

      /* Download all button */
      .batch-btn-dl-all {
        width: 100%; padding: 10px; border-radius: 9px; border: none;
        background: rgba(0,212,168,0.12);
        border: 1px solid rgba(0,212,168,0.25);
        color: var(--teal, #00d4a8);
        font-family: var(--font-body, sans-serif); font-size: 13.5px; font-weight: 600;
        cursor: pointer; margin-top: 10px; transition: all 0.18s ease; display: none;
      }
      .batch-btn-dl-all:hover { background: rgba(0,212,168,0.2); }
      .batch-btn-dl-all.show { display: block; }

      /* Trigger button di halaman converter */
      .batch-trigger-btn {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 9px 16px; border-radius: 9px;
        border: 1px solid var(--border2, rgba(255,255,255,0.13));
        background: var(--surface, #1c1c30); color: var(--text2, #8887a4);
        font-family: var(--font-body, sans-serif); font-size: 13px; font-weight: 500;
        cursor: pointer; transition: all 0.18s ease; white-space: nowrap;
      }
      .batch-trigger-btn:hover {
        border-color: var(--accent, #7c6aff); color: var(--accent2, #b8abff);
        background: rgba(124,106,255,0.07);
      }

      @media (max-width: 600px) {
        #batch-modal-card { padding: 20px 16px 18px; border-radius: 16px; }
        .batch-title { font-size: 16px; }
      }
    `;
    document.head.appendChild(s);
  }

  // ── HTML modal ───────────────────────────────────────────
  function injectModal() {
    if (document.getElementById("batch-modal-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "batch-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div id="batch-modal-card">
        <div class="batch-header">
          <h2 class="batch-title">⚡ Batch Processing</h2>
          <button class="batch-close" onclick="window.batchClose()" aria-label="Tutup">✕</button>
        </div>

        <!-- Mode tabs -->
        <div class="batch-mode-tabs">
          <button class="batch-mode-tab active" data-mode="compress" onclick="window.batchSetMode('compress',this)">🗜 Kompres</button>
          <button class="batch-mode-tab" data-mode="resize" onclick="window.batchSetMode('resize',this)">📐 Resize</button>
          <button class="batch-mode-tab" data-mode="convert" onclick="window.batchSetMode('convert',this)">🔁 Konversi</button>
          <button class="batch-mode-tab" data-mode="grayscale" onclick="window.batchSetMode('grayscale',this)">🎨 Abu-abu</button>
        </div>

        <!-- Upload zone -->
        <div class="batch-upload-zone" id="batch-upload-zone"
          onclick="document.getElementById('batch-file-input').click()">
          <div style="font-size:28px;margin-bottom:6px">🖼</div>
          <strong>Klik atau seret gambar ke sini</strong>
          <p>JPG, PNG, WEBP — bisa banyak sekaligus</p>
          <input type="file" id="batch-file-input" accept="image/*" multiple style="display:none"
            onchange="window.batchAddFiles(this.files)" />
        </div>

        <!-- Options per mode -->
        <div id="batch-options"></div>

        <!-- File queue -->
        <div class="batch-file-queue" id="batch-file-queue" style="display:none"></div>

        <!-- Overall progress -->
        <div class="batch-overall-progress" id="batch-overall-progress">
          <div class="batch-overall-bar">
            <div class="batch-overall-fill" id="batch-overall-fill"></div>
          </div>
          <p class="batch-overall-text" id="batch-overall-text">0 / 0 file selesai</p>
        </div>

        <!-- Actions -->
        <div class="batch-actions">
          <button class="batch-btn-cancel" onclick="window.batchClose()">Batal</button>
          <button class="batch-btn-run" id="batch-btn-run" disabled onclick="window.batchRun()">
            ⚡ Proses Semua
          </button>
        </div>

        <button class="batch-btn-dl-all" id="batch-btn-dl-all" onclick="window.batchDownloadAll()">
          ⬇ Unduh Semua File (ZIP)
        </button>
      </div>
    `;

    overlay.addEventListener("click", (e) => { if (e.target === overlay) window.batchClose(); });
    document.body.appendChild(overlay);

    // Init drag drop untuk batch upload zone
    const bz = document.getElementById("batch-upload-zone");
    bz.addEventListener("dragover",  e => { e.preventDefault(); bz.classList.add("drag-over"); });
    bz.addEventListener("dragleave", () => bz.classList.remove("drag-over"));
    bz.addEventListener("drop", e => {
      e.preventDefault(); bz.classList.remove("drag-over");
      window.batchAddFiles(e.dataTransfer.files);
    });

    renderBatchOptions();
  }

  // ── Options HTML per mode ────────────────────────────────
  const BATCH_OPTIONS_HTML = {
    compress: `
      <div class="batch-option-row">
        <div><p class="batch-opt-label">Kualitas: <span id="b-quality-val">75</span>%</p>
        <p class="batch-opt-desc">Berlaku untuk semua file</p></div>
        <input type="range" id="b-quality" min="10" max="95" value="75" class="slider" style="width:120px"
          oninput="document.getElementById('b-quality-val').textContent=this.value" />
      </div>
      <div class="batch-option-row">
        <div><p class="batch-opt-label">Format output</p></div>
        <div class="format-pills">
          <label class="format-pill"><input type="radio" name="b-fmt" value="same" checked /> Sama</label>
          <label class="format-pill"><input type="radio" name="b-fmt" value="image/jpeg" /> JPG</label>
          <label class="format-pill"><input type="radio" name="b-fmt" value="image/webp" /> WEBP</label>
        </div>
      </div>`,

    resize: `
      <div class="batch-option-row">
        <div><p class="batch-opt-label">Lebar maksimum (px)</p>
        <p class="batch-opt-desc">Tinggi menyesuaikan rasio otomatis</p></div>
        <input type="number" id="b-max-w" class="form-input" value="1280"
          min="100" max="9999" style="max-width:90px" />
      </div>
      <div class="batch-option-row">
        <div><p class="batch-opt-label">Hanya perkecil</p>
        <p class="batch-opt-desc">Gambar yang sudah lebih kecil tidak diubah</p></div>
        <label class="toggle"><input type="checkbox" id="b-only-shrink" checked /><span class="toggle-track"></span></label>
      </div>`,

    convert: `
      <div class="batch-option-row">
        <div><p class="batch-opt-label">Konversi ke format</p></div>
        <div class="format-pills">
          <label class="format-pill"><input type="radio" name="b-conv-fmt" value="image/png" checked /> PNG</label>
          <label class="format-pill"><input type="radio" name="b-conv-fmt" value="image/jpeg" /> JPG</label>
          <label class="format-pill"><input type="radio" name="b-conv-fmt" value="image/webp" /> WEBP</label>
        </div>
      </div>`,

    grayscale: `
      <div class="batch-option-row" style="border:none">
        <div><p class="batch-opt-label">Semua gambar diubah ke hitam putih</p>
        <p class="batch-opt-desc">Format output sama dengan file asli</p></div>
        <span style="font-size:20px">🎨</span>
      </div>`,
  };

  function renderBatchOptions() {
    const el = document.getElementById("batch-options");
    if (el) el.innerHTML = BATCH_OPTIONS_HTML[batchMode] || "";
  }

  // ── Tambah file ke antrian ───────────────────────────────
  window.batchAddFiles = function(fileList) {
    const existing = new Set(batchFiles.map(f => f.name + f.size));
    for (const f of fileList) {
      if (!f.type.startsWith("image/")) continue;
      if (existing.has(f.name + f.size)) continue;
      batchFiles.push(f);
    }
    renderBatchQueue();
  };

  function renderBatchQueue() {
    const el = document.getElementById("batch-file-queue");
    const btn = document.getElementById("batch-btn-run");
    if (!el) return;

    if (!batchFiles.length) {
      el.style.display = "none";
      if (btn) btn.disabled = true;
      return;
    }

    el.style.display = "flex";
    el.innerHTML = batchFiles.map((f, i) => `
      <div class="batch-file-item" id="bfi-${i}">
        <span class="bfi-icon">🖼</span>
        <span class="bfi-name">${escHtml(f.name)}</span>
        <span class="bfi-size">${fmtSizeB(f.size)}</span>
        <span class="bfi-status" id="bfi-status-${i}" style="color:var(--text3)">Menunggu</span>
        <button class="bfi-del" onclick="window.batchRemoveFile(${i})" ${batchRunning ? "disabled" : ""}>✕</button>
      </div>`).join("");

    if (btn) btn.disabled = batchRunning || batchFiles.length === 0;
  }

  window.batchRemoveFile = function(i) {
    batchFiles.splice(i, 1);
    renderBatchQueue();
  };

  // ── Set mode ─────────────────────────────────────────────
  window.batchSetMode = function(mode, btn) {
    batchMode = mode;
    document.querySelectorAll(".batch-mode-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderBatchOptions();
  };

  // ── Jalankan batch ───────────────────────────────────────
  window.batchRun = async function() {
    if (!batchFiles.length || batchRunning) return;
    batchRunning = true;

    const runBtn = document.getElementById("batch-btn-run");
    if (runBtn) { runBtn.disabled = true; runBtn.textContent = "⏳ Memproses..."; }

    const progressWrap = document.getElementById("batch-overall-progress");
    const progressFill = document.getElementById("batch-overall-fill");
    const progressText = document.getElementById("batch-overall-text");
    if (progressWrap) progressWrap.style.display = "block";

    window._batchResults = [];
    let done = 0;

    for (let i = 0; i < batchFiles.length; i++) {
      const f    = batchFiles[i];
      const item = document.getElementById(`bfi-${i}`);
      const stat = document.getElementById(`bfi-status-${i}`);

      if (item) item.classList.add("running");
      if (stat) { stat.textContent = "Memproses..."; stat.style.color = "var(--accent2)"; }

      try {
        const result = await processBatchFile(f);
        window._batchResults.push({ blob: result.blob, filename: result.filename });

        if (item) item.classList.replace("running", "done");
        if (stat) {
          const saved = f.size > result.blob.size
            ? ` (-${Math.round((1 - result.blob.size/f.size)*100)}%)`
            : "";
          stat.textContent = "✓" + saved;
          stat.style.color = "var(--success)";
        }
      } catch(e) {
        if (item) item.classList.replace("running", "failed");
        if (stat) { stat.textContent = "✗ Gagal"; stat.style.color = "var(--danger)"; }
      }

      done++;
      const pct = Math.round((done / batchFiles.length) * 100);
      if (progressFill) progressFill.style.width = pct + "%";
      if (progressText) progressText.textContent  = `${done} / ${batchFiles.length} file selesai`;
    }

    batchRunning = false;
    if (runBtn) { runBtn.textContent = "✓ Selesai"; }

    const dlAllBtn = document.getElementById("batch-btn-dl-all");
    if (dlAllBtn && window._batchResults.length > 0) dlAllBtn.classList.add("show");

    if (typeof showToast === "function") {
      showToast(`${window._batchResults.length} file berhasil diproses ✓`);
    }
  };

  // ── Proses 1 file sesuai mode aktif ─────────────────────
  async function processBatchFile(file) {
    const canvas = document.createElement("canvas");
    const bm     = await createImageBitmap(file);
    let w = bm.width, h = bm.height;
    let mime = file.type;
    let ext  = file.name.split(".").pop().toLowerCase();
    let suffix = "";

    if (batchMode === "compress") {
      const quality  = parseInt(document.getElementById("b-quality")?.value || 75) / 100;
      const fmtRadio = document.querySelector('input[name="b-fmt"]:checked');
      const fmt      = fmtRadio?.value || "same";
      if (fmt !== "same") { mime = fmt; ext = fmt === "image/jpeg" ? "jpg" : "webp"; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(bm, 0, 0);
      suffix = "_kompres";
      const blob = await new Promise(res => canvas.toBlob(res, mime === file.type ? "image/jpeg" : mime, quality));
      return { blob, filename: file.name.replace(/\.[^.]+$/, "") + suffix + "." + ext };
    }

    if (batchMode === "resize") {
      const maxW      = parseInt(document.getElementById("b-max-w")?.value || 1280);
      const onlyShrink = document.getElementById("b-only-shrink")?.checked ?? true;
      if (!onlyShrink || w > maxW) {
        h = Math.round(h * (maxW / w));
        w = maxW;
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(bm, 0, 0, w, h);
      suffix = `_${w}x${h}`;
      const blob = await new Promise(res => canvas.toBlob(res, mime, 0.92));
      return { blob, filename: file.name.replace(/\.[^.]+$/, "") + suffix + "." + ext };
    }

    if (batchMode === "convert") {
      const fmtRadio = document.querySelector('input[name="b-conv-fmt"]:checked');
      mime = fmtRadio?.value || "image/png";
      ext  = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(bm, 0, 0);
      const blob = await new Promise(res => canvas.toBlob(res, mime, 0.93));
      return { blob, filename: file.name.replace(/\.[^.]+$/, "") + "." + ext };
    }

    if (batchMode === "grayscale") {
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.filter = "grayscale(1)";
      ctx.drawImage(bm, 0, 0);
      const blob = await new Promise(res => canvas.toBlob(res, mime, 0.93));
      return { blob, filename: file.name.replace(/\.[^.]+$/, "") + "_abuabu." + ext };
    }

    throw new Error("Mode tidak dikenal");
  }

  // ── Download semua sebagai ZIP ───────────────────────────
  window.batchDownloadAll = async function() {
    const results = window._batchResults || [];
    if (!results.length) return;

    // Kalau hanya 1 file, langsung download tanpa ZIP
    if (results.length === 1) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(results[0].blob);
      a.download = results[0].filename;
      a.click();
      return;
    }

    // Buat ZIP sederhana manual (tanpa library eksternal)
    // Gunakan JSZip kalau tersedia, fallback ke download satu per satu
    if (window.JSZip) {
      const zip = new JSZip();
      results.forEach(r => zip.file(r.filename, r.blob));
      const content = await zip.generateAsync({ type:"blob", compression:"DEFLATE", compressionOptions:{ level:6 } });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `batch_${Date.now()}.zip`;
      a.click();
      if (typeof showToast === "function") showToast("ZIP berhasil diunduh ✓");
    } else {
      // Fallback: download satu per satu dengan delay
      if (typeof showToast === "function") showToast("Mengunduh " + results.length + " file...");
      for (let i = 0; i < results.length; i++) {
        await new Promise(res => setTimeout(res, i * 300));
        const a = document.createElement("a");
        a.href = URL.createObjectURL(results[i].blob);
        a.download = results[i].filename;
        a.click();
      }
    }
  };

  // ── Open / close ─────────────────────────────────────────
  window.batchOpen = function() {
    batchFiles   = [];
    batchRunning = false;
    window._batchResults = [];

    injectStyles();
    injectModal();

    const overlay = document.getElementById("batch-modal-overlay");
    if (!overlay) return;

    // Reset state UI
    renderBatchQueue();
    renderBatchOptions();
    const progressWrap = document.getElementById("batch-overall-progress");
    if (progressWrap) progressWrap.style.display = "none";
    const dlAllBtn = document.getElementById("batch-btn-dl-all");
    if (dlAllBtn) dlAllBtn.classList.remove("show");
    const runBtn = document.getElementById("batch-btn-run");
    if (runBtn) { runBtn.disabled = true; runBtn.textContent = "⚡ Proses Semua"; }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("show");
        document.body.style.overflow = "hidden";
      });
    });
  };

  window.batchClose = function() {
    const overlay = document.getElementById("batch-modal-overlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  };

  // ── Keyboard ─────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const overlay = document.getElementById("batch-modal-overlay");
      if (overlay?.classList.contains("show")) window.batchClose();
    }
  });

  // ── Utilitas lokal ───────────────────────────────────────
  function fmtSizeB(b) {
    if (b < 1024)    return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  }
  function escHtml(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

})();
