// ============================================================
// js/pages/converter.js — Logic halaman Converter
// Depends: config.js, auth.js, ui.js (harus di-load lebih dulu)
// ============================================================

// ── Inisialisasi halaman (harus di atas sebelum apapun) ───
requireLogin();
renderSidebar("converter");
applyGlobalSettings();

// ── State ─────────────────────────────────────────────────
let currentTool   = null;
let uploadedFiles = [];

// ── Definisi semua tool ───────────────────────────────────

/**
 * @typedef {{ title:string, desc:string, icon:string, accept:string, multiple:boolean, hint:string }} ToolDef
 * @type {Record<string, ToolDef>}
 */
const TOOLS = {
  // PDF
  merge:        { title:"Gabung PDF",           desc:"Gabungkan beberapa file PDF menjadi satu",                              icon:"🔗", accept:".pdf",        multiple:true,  hint:"Unggah 2 atau lebih file PDF" },
  split:        { title:"Pisah PDF",             desc:"Pisahkan halaman PDF menjadi file-file terpisah",                       icon:"✂️", accept:".pdf",        multiple:false, hint:"Unggah 1 file PDF" },
  rotate:       { title:"Putar PDF",             desc:"Putar semua halaman PDF",                                               icon:"🔄", accept:".pdf",        multiple:false, hint:"Unggah 1 file PDF" },
  deletepages:  { title:"Hapus Halaman PDF",     desc:"Hapus halaman tertentu dari PDF",                                       icon:"🗑",  accept:".pdf",        multiple:false, hint:"Unggah 1 file PDF" },
  compresspdf:  { title:"Kompres PDF",           desc:"Perkecil ukuran file PDF dengan mengurangi kualitas gambar di dalamnya",icon:"🗜",  accept:".pdf",        multiple:false, hint:"Unggah 1 file PDF" },
  watermarkpdf: { title:"Tanda Air PDF",         desc:"Tambahkan teks tanda air di setiap halaman PDF",                       icon:"💧", accept:".pdf",        multiple:false, hint:"Unggah 1 file PDF" },
  passwordpdf:  { title:"Sandi PDF",             desc:"Lindungi PDF dengan kata sandi enkripsi",                               icon:"🔐", accept:".pdf",        multiple:false, hint:"Unggah 1 file PDF" },
  pdf2txt:      { title:"PDF ke Teks",           desc:"Ekstrak semua teks dari file PDF",                                      icon:"📑", accept:".pdf",        multiple:false, hint:"Unggah 1 file PDF (teks harus bisa disorot)" },
  img2pdf:      { title:"Gambar ke PDF",         desc:"Susun beberapa gambar menjadi dokumen PDF",                             icon:"🖼",  accept:"image/*",     multiple:true,  hint:"Unggah satu atau beberapa gambar (JPG, PNG, WEBP)" },
  pdf2img:      { title:"PDF ke JPG",            desc:"Setiap halaman PDF dikonversi menjadi gambar JPG",                      icon:"📄", accept:".pdf",        multiple:false, hint:"Unggah 1 file PDF" },
  // Gambar
  imgconvert:   { title:"Konversi Format",       desc:"Ubah format gambar JPG ↔ PNG ↔ WEBP",                                  icon:"🔁", accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  compress:     { title:"Kompres Gambar",        desc:"Perkecil ukuran file tanpa banyak kehilangan kualitas",                 icon:"🗜",  accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  resize:       { title:"Ubah Ukuran Gambar",    desc:"Ubah dimensi (lebar × tinggi) gambar",                                  icon:"📐", accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  crop:         { title:"Potong Gambar",         desc:"Potong area gambar secara visual",                                      icon:"✂️", accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  rotate_img:   { title:"Putar / Balik",         desc:"Putar atau mirror gambar",                                              icon:"🔄", accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  adjust:       { title:"Sesuaikan Gambar",      desc:"Ubah kecerahan, kontras, dan saturasi",                                 icon:"🎛",  accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  grayscale:    { title:"Skala Abu-abu",         desc:"Ubah gambar berwarna menjadi hitam putih",                              icon:"🎨", accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  blur:         { title:"Efek Blur",             desc:"Tambahkan efek blur pada gambar",                                       icon:"🌫",  accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  watermarkimg: { title:"Tanda Air Gambar",      desc:"Tambahkan teks tanda air di atas foto",                                 icon:"💧", accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  exif:         { title:"Penampil EXIF",         desc:"Lihat metadata foto dan hapus untuk privasi",                           icon:"📋", accept:"image/jpeg,image/jpg", multiple:false, hint:"Unggah 1 file gambar JPG" },
  base64img:    { title:"Gambar → Base64",       desc:"Encode gambar menjadi string Base64 untuk embed HTML",                  icon:"🔤", accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar" },
  mergeimg:     { title:"Gabung Gambar",         desc:"Susun beberapa gambar horizontal/vertikal jadi satu",                   icon:"🧩", accept:"image/*",     multiple:true,  hint:"Unggah 2 gambar atau lebih" },
  ascii:        { title:"Seni ASCII",            desc:"Ubah gambar menjadi karakter teks ASCII yang bisa disalin atau diunduh",icon:"🎨", accept:"image/*",     multiple:false, hint:"Unggah 1 file gambar (JPG, PNG, WEBP)" },
  // Dokumen
  md2html:      { title:"Markdown → HTML",       desc:"Konversi file .md menjadi halaman HTML siap pakai",                    icon:"📝", accept:".md,.txt",    multiple:false, hint:"Unggah file .md atau .txt berisi Markdown" },
  csv2json:     { title:"CSV ↔ JSON",            desc:"Konversi data CSV ke JSON atau sebaliknya",                             icon:"📊", accept:".csv,.json",  multiple:false, hint:"Unggah file .csv atau .json" },
};

// ── Opsi HTML per tool ────────────────────────────────────
const TOOL_OPTIONS = {
  split: `
    <div class="option-row">
      <div><p class="opt-label">Mode pisah</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="split-mode" value="all" checked /> Semua halaman</label>
        <label class="format-pill"><input type="radio" name="split-mode" value="range" /> Rentang</label>
      </div>
    </div>
    <div id="split-range-row" style="display:none" class="option-row">
      <div><p class="opt-label">Halaman (contoh: 1-3, 5, 7-9)</p></div>
      <input type="text" id="split-range" class="form-input" placeholder="1-3, 5" style="max-width:180px"
        maxlength="50" oninput="this.value=this.value.replace(/[^0-9,\- ]/g,'')" />
    </div>`,

  rotate: `
    <div class="option-row">
      <div><p class="opt-label">Arah rotasi</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="rot-deg" value="90" checked /> 90° ↻</label>
        <label class="format-pill"><input type="radio" name="rot-deg" value="180" /> 180°</label>
        <label class="format-pill"><input type="radio" name="rot-deg" value="270" /> 90° ↺</label>
      </div>
    </div>`,

  deletepages: `
    <div class="option-row">
      <div><p class="opt-label">Halaman yang dihapus</p><p class="opt-desc">contoh: 2, 4-6, 8</p></div>
      <input type="text" id="del-pages" class="form-input" placeholder="2, 4-6, 8" style="max-width:180px"
        maxlength="50" oninput="this.value=this.value.replace(/[^0-9,\- ]/g,'')" />
    </div>`,

  compresspdf: `
    <div class="option-row">
      <div><p class="opt-label">Level kompresi</p><p class="opt-desc">Memengaruhi kualitas gambar di dalam PDF</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="pdf-compress" value="low" /> Ringan</label>
        <label class="format-pill"><input type="radio" name="pdf-compress" value="med" checked /> Sedang</label>
        <label class="format-pill"><input type="radio" name="pdf-compress" value="high" /> Agresif</label>
      </div>
    </div>`,

  watermarkpdf: `
    <div class="option-row">
      <div><p class="opt-label">Teks Tanda Air</p></div>
      <input type="text" id="wm-text" class="form-input" placeholder="RAHASIA / DRAF / nama kamu"
        style="max-width:220px" value="RAHASIA" maxlength="50"
        oninput="this.value=this.value.replace(/[<>\"'\`]/g,'')" />
    </div>
    <div class="option-row">
      <div><p class="opt-label">Opasitas (%)</p></div>
      <input type="range" id="wm-opacity" min="5" max="60" value="20" class="slider" style="width:140px"
        oninput="document.getElementById('wm-op-val').textContent=this.value+'%'" />
      <span id="wm-op-val" style="font-size:12px;color:var(--accent2);min-width:36px">20%</span>
    </div>
    <div class="option-row">
      <div><p class="opt-label">Warna teks</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="wm-color" value="gray" checked /> Abu-abu</label>
        <label class="format-pill"><input type="radio" name="wm-color" value="red" /> Merah</label>
        <label class="format-pill"><input type="radio" name="wm-color" value="blue" /> Biru</label>
      </div>
    </div>`,

  passwordpdf: `
    <div class="option-row">
      <div><p class="opt-label">Kata Sandi</p><p class="opt-desc">Minimal 4 karakter</p></div>
      <input type="password" id="pdf-password" class="form-input" placeholder="Masukkan sandi..."
        style="max-width:200px" maxlength="100" />
    </div>
    <div class="option-row">
      <div><p class="opt-label">Konfirmasi Sandi</p></div>
      <input type="password" id="pdf-password2" class="form-input" placeholder="Ulangi sandi..."
        style="max-width:200px" maxlength="100" />
    </div>`,

  img2pdf: `
    <div class="option-row">
      <div><p class="opt-label">Ukuran halaman</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="pdf-page" value="fit" checked /> Sesuai gambar</label>
        <label class="format-pill"><input type="radio" name="pdf-page" value="a4" /> A4</label>
      </div>
    </div>`,

  pdf2img: `
    <div class="option-row">
      <div><p class="opt-label">Kualitas render</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="pdf-scale" value="1.5" /> Normal</label>
        <label class="format-pill"><input type="radio" name="pdf-scale" value="2" checked /> HD</label>
        <label class="format-pill"><input type="radio" name="pdf-scale" value="3" /> Full HD</label>
      </div>
    </div>`,

  imgconvert: `
    <div class="option-row">
      <div><p class="opt-label">Konversi ke format</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="imgfmt" value="image/png" checked /> PNG</label>
        <label class="format-pill"><input type="radio" name="imgfmt" value="image/jpeg" /> JPG</label>
        <label class="format-pill"><input type="radio" name="imgfmt" value="image/webp" /> WEBP</label>
      </div>
    </div>`,

  compress: `
    <div class="option-row">
      <div><p class="opt-label">Kualitas: <span id="cq-val">72</span>%</p><p class="opt-desc">Makin kecil = ukuran file makin kecil</p></div>
      <input type="range" id="compress-quality" min="10" max="95" value="72" class="slider" style="width:140px"
        oninput="document.getElementById('cq-val').textContent=this.value" />
    </div>`,

  resize: `
    <div class="option-row">
      <div><p class="opt-label">Lebar (px)</p></div>
      <input type="number" id="resize-w" class="form-input" placeholder="contoh 800" style="max-width:120px" min="1" max="10000" />
    </div>
    <div class="option-row">
      <div><p class="opt-label">Tinggi (px)</p><p class="opt-desc">Kosongkan = jaga rasio otomatis</p></div>
      <input type="number" id="resize-h" class="form-input" placeholder="otomatis" style="max-width:120px" min="1" max="10000" />
    </div>`,

  crop: `
    <div class="option-row" style="border:none;flex-direction:column;align-items:flex-start;gap:8px">
      <p class="opt-label">Seret area di atas gambar untuk memilih area potong</p>
      <p class="opt-desc" id="crop-coords-label">Belum ada seleksi</p>
      <div id="crop-wrap" style="display:none">
        <img id="crop-img" src="" alt="Gambar untuk dipotong" draggable="false" />
        <div id="crop-select"></div>
      </div>
    </div>`,

  rotate_img: `
    <div class="option-row">
      <div><p class="opt-label">Rotasi</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="ri-rot" value="90" checked /> 90° ↻</label>
        <label class="format-pill"><input type="radio" name="ri-rot" value="180" /> 180°</label>
        <label class="format-pill"><input type="radio" name="ri-rot" value="270" /> 90° ↺</label>
      </div>
    </div>
    <div class="option-row">
      <div><p class="opt-label">Balik / Mirror</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="ri-flip" value="none" checked /> Tidak</label>
        <label class="format-pill"><input type="radio" name="ri-flip" value="h" /> Horizontal</label>
        <label class="format-pill"><input type="radio" name="ri-flip" value="v" /> Vertikal</label>
      </div>
    </div>`,

  adjust: `
    <div class="adjust-grid" style="margin-top:4px">
      <div class="adjust-row">
        <label>☀️ Kecerahan</label>
        <input type="range" id="adj-brightness" min="-100" max="100" value="0" class="slider"
          oninput="document.getElementById('adj-br-val').textContent=this.value;previewAdjust()" />
        <span id="adj-br-val">0</span>
      </div>
      <div class="adjust-row">
        <label>🎚 Kontras</label>
        <input type="range" id="adj-contrast" min="-100" max="100" value="0" class="slider"
          oninput="document.getElementById('adj-ct-val').textContent=this.value;previewAdjust()" />
        <span id="adj-ct-val">0</span>
      </div>
      <div class="adjust-row">
        <label>🌈 Saturasi</label>
        <input type="range" id="adj-saturation" min="-100" max="100" value="0" class="slider"
          oninput="document.getElementById('adj-st-val').textContent=this.value;previewAdjust()" />
        <span id="adj-st-val">0</span>
      </div>
    </div>
    <div id="adjust-preview-wrap" style="display:none;margin-top:12px">
      <canvas id="adjust-preview-canvas" style="max-width:100%;border-radius:8px;border:1px solid var(--border2)"></canvas>
    </div>`,

  blur: `
    <div class="option-row">
      <div><p class="opt-label">Intensitas blur: <span id="blur-val">4</span>px</p></div>
      <input type="range" id="blur-amount" min="1" max="30" value="4" class="slider" style="width:140px"
        oninput="document.getElementById('blur-val').textContent=this.value" />
    </div>`,

  watermarkimg: `
    <div class="option-row">
      <div><p class="opt-label">Teks Tanda Air</p></div>
      <input type="text" id="wmi-text" class="form-input" placeholder="© nama / DRAF / logo teks"
        style="max-width:220px" value="© UcupzConvert" maxlength="80"
        oninput="this.value=this.value.replace(/[<>\"'\`]/g,'');previewWatermarkImg()" />
    </div>
    <div class="option-row">
      <div><p class="opt-label">Posisi</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="wmi-pos" value="center" checked onchange="previewWatermarkImg()" /> Tengah</label>
        <label class="format-pill"><input type="radio" name="wmi-pos" value="br" onchange="previewWatermarkImg()" /> Kanan Bawah</label>
        <label class="format-pill"><input type="radio" name="wmi-pos" value="bl" onchange="previewWatermarkImg()" /> Kiri Bawah</label>
      </div>
    </div>
    <div class="option-row">
      <div><p class="opt-label">Opasitas: <span id="wmi-op-val">35</span>%</p></div>
      <input type="range" id="wmi-opacity" min="5" max="100" value="35" class="slider" style="width:140px"
        oninput="document.getElementById('wmi-op-val').textContent=this.value;previewWatermarkImg()" />
    </div>
    <div id="wmi-preview-wrap" style="display:none;margin-top:12px">
      <canvas id="wmi-canvas" style="max-width:100%;border-radius:8px;border:1px solid var(--border2)"></canvas>
    </div>`,

  mergeimg: `
    <div class="option-row">
      <div><p class="opt-label">Susun</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="merge-dir" value="h" checked /> Horizontal</label>
        <label class="format-pill"><input type="radio" name="merge-dir" value="v" /> Vertikal</label>
      </div>
    </div>
    <div class="option-row">
      <div><p class="opt-label">Jarak antar gambar (px)</p></div>
      <input type="number" id="merge-gap" class="form-input" value="0" min="0" max="200" style="max-width:80px" />
    </div>`,

  csv2json: `
    <div class="option-row">
      <div><p class="opt-label">Mode konversi</p><p class="opt-desc">Terdeteksi otomatis dari ekstensi file</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="cj-mode" value="auto" checked /> Otomatis</label>
        <label class="format-pill"><input type="radio" name="cj-mode" value="csv2json" /> CSV → JSON</label>
        <label class="format-pill"><input type="radio" name="cj-mode" value="json2csv" /> JSON → CSV</label>
      </div>
    </div>`,

  ascii: `
    <div class="option-row">
      <div><p class="opt-label">Lebar: <span id="ascii-width-val">80</span> kolom</p></div>
      <input type="range" id="ascii-width" min="40" max="200" value="80" class="slider" style="width:140px"
        oninput="document.getElementById('ascii-width-val').textContent=this.value" />
    </div>
    <div class="option-row">
      <div><p class="opt-label">Set karakter</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="ascii-charset" value="detailed" checked /> Detail</label>
        <label class="format-pill"><input type="radio" name="ascii-charset" value="simple" /> Simpel</label>
        <label class="format-pill"><input type="radio" name="ascii-charset" value="blocks" /> Blok</label>
        <label class="format-pill"><input type="radio" name="ascii-charset" value="emoji" /> Emoji</label>
      </div>
    </div>
    <div class="option-row">
      <div><p class="opt-label">Mode warna</p></div>
      <div class="format-pills">
        <label class="format-pill"><input type="radio" name="ascii-color" value="bw" checked /> Hitam putih</label>
        <label class="format-pill"><input type="radio" name="ascii-color" value="color" /> Berwarna</label>
      </div>
    </div>
    <div class="option-row" style="border:none">
      <div><p class="opt-label">Balik warna</p><p class="opt-desc">Cocok untuk latar gelap</p></div>
      <label class="toggle"><input type="checkbox" id="ascii-invert" /><span class="toggle-track"></span></label>
    </div>
    <div id="ascii-result-wrap" style="display:none;margin-top:12px">
      <pre id="ascii-output-pre" style="font-family:var(--font-mono);font-size:7px;line-height:1.1;overflow-x:auto;white-space:pre;color:var(--text);background:var(--bg);padding:12px;border-radius:8px;max-height:400px;overflow-y:auto"></pre>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn btn-secondary" onclick="asciiCopyWA()" style="font-size:12px;padding:6px 12px">📱 Salin untuk WA</button>
        <button class="btn btn-secondary" onclick="asciiCopy()" style="font-size:12px;padding:6px 12px">📋 Salin Teks</button>
      </div>
    </div>`,
};

// ── Filter kategori ───────────────────────────────────────

/**
 * Filter tampilan grid tool berdasarkan kategori.
 * @param {string} cat - Kategori: 'all' | 'pdf' | 'image' | 'doc'
 * @param {HTMLElement} btn - Tombol tab yang diklik
 */
function filterCat(cat, btn) {
  document.querySelectorAll(".cat-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".grid-cat-label").forEach(l => {
    l.style.display = (cat === "all" || l.dataset.cat === cat) ? "" : "none";
  });
  document.querySelectorAll(".tool-grid[data-cat]").forEach(g => {
    g.style.display = (cat === "all" || g.dataset.cat === cat) ? "" : "none";
  });
}

/**
 * Buka panel tool tertentu.
 * @param {string} id - ID tool dari objek TOOLS
 */
function openTool(id) {
  currentTool   = id;
  uploadedFiles = [];
  const t = TOOLS[id];

  document.getElementById("tool-grid-section").style.display = "none";
  document.getElementById("panel-title").textContent         = t.title;
  document.getElementById("panel-desc").textContent          = t.desc;
  document.getElementById("panel-upload-icon").textContent   = t.icon;
  document.getElementById("panel-upload-hint").textContent   = t.hint;
  document.getElementById("panel-input").accept              = t.accept;
  document.getElementById("panel-input").multiple            = t.multiple;
  document.getElementById("panel-input").value               = "";
  document.getElementById("file-list").innerHTML             = "";
  document.getElementById("tool-options").innerHTML          = TOOL_OPTIONS[id] || "";
  document.getElementById("btn-process").disabled            = true;
  document.getElementById("btn-clear").style.display         = "none";
  document.getElementById("result-box").classList.remove("show");
  document.getElementById("progress-bar").style.display      = "none";
  document.getElementById("panel-dropzone").style.display    = "block";
  document.getElementById("img-source-preview-wrap").style.display = "none";
  document.getElementById("tool-panel").classList.add("show");

  if (id === "split") {
    document.querySelectorAll('input[name="split-mode"]').forEach(r => {
      r.addEventListener("change", () => {
        document.getElementById("split-range-row").style.display =
          (r.value === "range" && r.checked) ? "flex" : "none";
      });
    });
  }
}

/** Tutup panel tool dan kembali ke grid. */
function closeTool() {
  currentTool   = null;
  uploadedFiles = [];
  document.getElementById("tool-panel").classList.remove("show");
  document.getElementById("tool-grid-section").style.display = "block";
}

// ── Penanganan file ───────────────────────────────────────

/**
 * Terima file dari input atau drop, tambahkan ke daftar.
 * @param {FileList} fileList
 */
function handlePanelFiles(fileList) {
  const t = TOOLS[currentTool];
  if (!t.multiple) uploadedFiles = [];
  for (const f of fileList) uploadedFiles.push(f);
  renderFileList();
  onFilesReady();
}

/** Render daftar file yang sudah diunggah. */
function renderFileList() {
  const list = document.getElementById("file-list");
  list.innerHTML = uploadedFiles.map((f, i) => `
    <div class="file-item">
      <span class="fi-icon">${f.type.includes("pdf") ? "📄" : "🖼"}</span>
      <span class="fi-name">${escHtml(sanitizeString(f.name, 100))}</span>
      <span class="fi-size">${fmtSize(f.size)}</span>
      <button class="fi-del" onclick="removeFile(${i})" aria-label="Hapus file">✕</button>
    </div>`).join("");
  document.getElementById("btn-process").disabled        = uploadedFiles.length === 0;
  document.getElementById("btn-clear").style.display     = uploadedFiles.length > 0 ? "inline-flex" : "none";
  document.getElementById("result-box").classList.remove("show");
}

/** @param {number} idx - Indeks file yang dihapus */
function removeFile(idx) { uploadedFiles.splice(idx, 1); renderFileList(); }

/** Hapus semua file dari daftar. */
function clearFiles() {
  uploadedFiles = [];
  document.getElementById("panel-input").value = "";
  renderFileList();
  document.getElementById("img-source-preview-wrap").style.display = "none";
}

/**
 * Callback setelah file berhasil dipilih — inisialisasi pratinjau & fitur khusus.
 */
function onFilesReady() {
  const imgTools = ["compress","resize","crop","rotate_img","adjust","grayscale","blur",
                    "watermarkimg","exif","base64img","imgconvert","mergeimg","ascii"];
  if (imgTools.includes(currentTool) && uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith("image/")) {
    const url     = URL.createObjectURL(uploadedFiles[0]);
    const preview = document.getElementById("img-source-preview");
    preview.src   = url;
    document.getElementById("img-source-preview-wrap").style.display = "block";

    if (currentTool === "crop") initCrop(url);
    if (currentTool === "adjust") {
      const img = new Image();
      img.onload = () => { window._adjImg = img; previewAdjust(); };
      img.src = url;
    }
    if (currentTool === "watermarkimg") {
      const img = new Image();
      img.onload = () => { window._wmiImg = img; previewWatermarkImg(); };
      img.src = url;
    }
  }
}

// ── Progress & hasil ──────────────────────────────────────

/**
 * Set nilai progress bar.
 * @param {number} pct - Persentase 0-100
 */
function setProgress(pct) {
  document.getElementById("progress-bar").style.display = "block";
  document.getElementById("progress-fill").style.width  = pct + "%";
}

/**
 * Tampilkan kotak hasil dengan tombol unduh.
 * @param {string} title
 * @param {string} desc
 * @param {{ label:string, blob:Blob, filename:string }[]} downloads
 */
function showResult(title, desc, downloads) {
  document.getElementById("result-title").textContent = title;
  document.getElementById("result-desc").textContent  = desc;
  document.getElementById("result-buttons").innerHTML = downloads.map((d, i) =>
    `<button class="btn btn-primary" style="font-size:12px;padding:7px 14px" onclick="triggerDownload(${i})">⬇ ${escHtml(d.label)}</button>`
  ).join("");
  window._downloads = downloads;
  document.getElementById("result-box").classList.add("show");
  setProgress(100);
}

/**
 * Unduh file hasil pada indeks tertentu.
 * @param {number} i
 */
function triggerDownload(i) {
  const d = window._downloads[i];
  const a = document.createElement("a");
  a.href     = URL.createObjectURL(d.blob);
  a.download = d.filename;
  a.click();
  showToast("File diunduh ✓");
}

// ── Dispatcher utama ──────────────────────────────────────

/** Peta tool ID → fungsi handler */
const handlers = {
  merge, split, rotate, deletepages, compresspdf, watermarkpdf, passwordpdf,
  pdf2txt, img2pdf, pdf2img, imgconvert, compress, resize, crop: cropImg,
  rotate_img, adjust: adjustImg, grayscale, blur: blurImg,
  watermarkimg, exif: exifTool, base64img, mergeimg, md2html, csv2json, ascii: asciiArt,
};

/** Jalankan proses sesuai tool aktif. */
async function processFile() {
  if (!currentTool || uploadedFiles.length === 0) return;
  document.getElementById("btn-process").disabled = true;
  document.getElementById("result-box").classList.remove("show");
  setProgress(5);
  try {
    await handlers[currentTool]();
  } catch(e) {
    showToast("Gagal: " + e.message, "error");
    console.error(e);
    setProgress(0);
    document.getElementById("progress-bar").style.display = "none";
  }
  document.getElementById("btn-process").disabled = false;
}

// ════════════════════════════════════════════════════════════
// PDF TOOLS
// ════════════════════════════════════════════════════════════

/** Gabungkan beberapa PDF menjadi satu. */
async function merge() {
  if (uploadedFiles.length < 2) { showToast("Unggah minimal 2 file PDF", "error"); return; }
  const { PDFDocument } = PDFLib;
  const merged = await PDFDocument.create();
  for (let i = 0; i < uploadedFiles.length; i++) {
    setProgress(10 + Math.round((i / uploadedFiles.length) * 80));
    const buf   = await uploadedFiles[i].arrayBuffer();
    const doc   = await PDFDocument.load(buf);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }
  setProgress(95);
  const bytes = await merged.save();
  showResult("PDF berhasil digabung!", `${uploadedFiles.length} file → 1 PDF (${merged.getPageCount()} halaman)`,
    [{ label:"Unduh PDF", blob: new Blob([bytes], { type:"application/pdf" }), filename:"gabungan.pdf" }]);
}

/** Pisahkan halaman PDF. */
async function split() {
  const { PDFDocument } = PDFLib;
  const buf   = await uploadedFiles[0].arrayBuffer();
  const doc   = await PDFDocument.load(buf);
  const total = doc.getPageCount();
  const mode  = document.querySelector('input[name="split-mode"]:checked').value;
  let ranges  = [];

  if (mode === "all") {
    ranges = Array.from({ length: total }, (_, i) => [i]);
  } else {
    ranges = parseRanges(sanitizeString(document.getElementById("split-range").value, 100), total);
    if (!ranges.length) { showToast("Format rentang tidak valid", "error"); return; }
  }

  const downloads = [];
  for (let r = 0; r < ranges.length; r++) {
    setProgress(15 + Math.round((r / ranges.length) * 75));
    const nd = await PDFDocument.create();
    const cp = await nd.copyPages(doc, ranges[r]);
    cp.forEach(p => nd.addPage(p));
    const bytes = await nd.save();
    downloads.push({
      label: mode === "all" ? `Hal.${ranges[r][0]+1}` : `Bag.${r+1}`,
      blob: new Blob([bytes], { type:"application/pdf" }),
      filename: `pisah_${r+1}.pdf`,
    });
  }
  showResult("PDF berhasil dipecah!", `${ranges.length} file dari ${total} halaman`, downloads);
}

/** Putar semua halaman PDF. */
async function rotate() {
  const { PDFDocument, degrees } = PDFLib;
  const buf = await uploadedFiles[0].arrayBuffer();
  const doc = await PDFDocument.load(buf);
  const deg = parseInt(document.querySelector('input[name="rot-deg"]:checked').value);
  setProgress(40);
  doc.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle + deg) % 360)));
  setProgress(85);
  const bytes = await doc.save();
  const name  = uploadedFiles[0].name.replace(".pdf", "") + "_diputar.pdf";
  showResult("PDF berhasil diputar!", `Semua halaman diputar ${deg}°`,
    [{ label:"Unduh PDF", blob: new Blob([bytes], { type:"application/pdf" }), filename: name }]);
}

/** Hapus halaman tertentu dari PDF. */
async function deletepages() {
  const raw = sanitizeString(document.getElementById("del-pages").value, 100);
  if (!raw.trim()) { showToast("Masukkan nomor halaman yang ingin dihapus", "error"); return; }
  const { PDFDocument } = PDFLib;
  const buf      = await uploadedFiles[0].arrayBuffer();
  const doc      = await PDFDocument.load(buf);
  const total    = doc.getPageCount();
  const toDelete = new Set();
  parseRanges(raw, total).forEach(r => r.forEach(i => toDelete.add(i)));
  if (!toDelete.size) { showToast("Halaman tidak valid", "error"); return; }
  [...toDelete].sort((a, b) => b - a).forEach(i => doc.removePage(i));
  setProgress(80);
  const bytes = await doc.save();
  showResult("Halaman berhasil dihapus!", `${toDelete.size} halaman dihapus, tersisa ${doc.getPageCount()} halaman`,
    [{ label:"Unduh PDF", blob: new Blob([bytes], { type:"application/pdf" }), filename:"hapus_halaman.pdf" }]);
}

/** Kompres PDF dengan pdf-lib (re-save + object streams). */
async function compresspdf() {
  const { PDFDocument } = PDFLib;
  const buf  = await uploadedFiles[0].arrayBuffer();
  const doc  = await PDFDocument.load(buf, { ignoreEncryption: true });
  setProgress(50);
  const bytes = await doc.save({ addDefaultPage: false, useObjectStreams: true });
  setProgress(90);
  const saved = Math.max(0, Math.round((1 - bytes.byteLength / buf.byteLength) * 100));
  const name  = uploadedFiles[0].name.replace(".pdf", "") + "_terkompres.pdf";
  showResult("PDF berhasil dikompres!", `${fmtSize(buf.byteLength)} → ${fmtSize(bytes.byteLength)}${saved > 0 ? ` (hemat ${saved}%)` : ""}`,
    [{ label:"Unduh PDF", blob: new Blob([bytes], { type:"application/pdf" }), filename: name }]);
}

/** Tambahkan tanda air teks ke setiap halaman PDF. */
async function watermarkpdf() {
  const wmText  = sanitizeString(document.getElementById("wm-text").value || "TANDA AIR", 50);
  const opacity = parseFloat(document.getElementById("wm-opacity").value) / 100;
  const colorKey = document.querySelector('input[name="wm-color"]:checked').value;
  const colorMap = { gray:[0.5,0.5,0.5], red:[0.85,0.1,0.1], blue:[0.1,0.2,0.8] };
  const [r, g, b] = colorMap[colorKey];
  const { PDFDocument, rgb, degrees } = PDFLib;
  const buf = await uploadedFiles[0].arrayBuffer();
  const doc = await PDFDocument.load(buf);
  setProgress(30);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) * 0.12;
    page.drawText(wmText, {
      x: width / 2 - (wmText.length * fontSize * 0.3),
      y: height / 2,
      size: fontSize,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(45),
    });
  }
  setProgress(85);
  const bytes = await doc.save();
  const name  = uploadedFiles[0].name.replace(".pdf", "") + "_tanda_air.pdf";
  showResult("Tanda air berhasil ditambahkan!", `Teks "${wmText}" di ${doc.getPageCount()} halaman`,
    [{ label:"Unduh PDF", blob: new Blob([bytes], { type:"application/pdf" }), filename: name }]);
}

/** Proteksi PDF dengan kata sandi (catatan keterbatasan pdf-lib). */
async function passwordpdf() {
  const p1 = document.getElementById("pdf-password").value;
  const p2 = document.getElementById("pdf-password2").value;
  if (!p1 || p1.length < 4) { showToast("Sandi minimal 4 karakter", "error"); return; }
  if (p1 !== p2) { showToast("Sandi tidak cocok!", "error"); return; }
  const { PDFDocument } = PDFLib;
  const buf = await uploadedFiles[0].arrayBuffer();
  const doc = await PDFDocument.load(buf);
  setProgress(50);
  const bytes = await doc.save();
  setProgress(90);
  showToast("Catatan: enkripsi penuh memerlukan library premium.", "error");
  showResult("File disimpan",
    "pdf-lib versi gratis tidak mendukung enkripsi penuh. Gunakan browser print → Simpan PDF untuk proteksi dasar.",
    [{ label:"Unduh PDF", blob: new Blob([bytes], { type:"application/pdf" }), filename:"output.pdf" }]);
}

/** Ekstrak teks dari PDF menggunakan PDF.js. */
async function pdf2txt() {
  if (!window.pdfjsLib) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const buf  = await uploadedFiles[0].arrayBuffer();
  const pdf  = await pdfjsLib.getDocument({ data: buf }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    setProgress(10 + Math.round((i / pdf.numPages) * 80));
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text    = content.items.map(item => item.str).join(" ");
    fullText += `=== Halaman ${i} ===\n${text}\n\n`;
  }
  setProgress(95);
  const blob = new Blob([fullText], { type:"text/plain;charset=utf-8" });
  const name = uploadedFiles[0].name.replace(".pdf", "") + ".txt";
  showResult("Teks berhasil diekstrak!", `${pdf.numPages} halaman → file .txt`,
    [{ label:"Unduh TXT", blob, filename: name }]);
}

/** Konversi beberapa gambar menjadi satu PDF. */
async function img2pdf() {
  const { PDFDocument } = PDFLib;
  const pdfDoc  = await PDFDocument.create();
  const fitMode = document.querySelector('input[name="pdf-page"]:checked').value;
  const A4_W = 595, A4_H = 842;
  for (let i = 0; i < uploadedFiles.length; i++) {
    setProgress(10 + Math.round((i / uploadedFiles.length) * 80));
    const f   = uploadedFiles[i];
    const buf = await f.arrayBuffer();
    let embed;
    if (f.type === "image/png") {
      embed = await pdfDoc.embedPng(buf);
    } else {
      const blob2 = await canvasConvert(f, "image/jpeg", 0.92);
      embed = await pdfDoc.embedJpg(await blob2.arrayBuffer());
    }
    const d = embed.scale(1);
    let pw = d.width, ph = d.height;
    if (fitMode === "a4") {
      const sc = Math.min(A4_W / pw, A4_H / ph);
      pw *= sc; ph *= sc;
      const page = pdfDoc.addPage([A4_W, A4_H]);
      page.drawImage(embed, { x:(A4_W-pw)/2, y:(A4_H-ph)/2, width:pw, height:ph });
    } else {
      const page = pdfDoc.addPage([pw, ph]);
      page.drawImage(embed, { x:0, y:0, width:pw, height:ph });
    }
  }
  setProgress(95);
  const bytes = await pdfDoc.save();
  showResult("Gambar berhasil dijadikan PDF!", `${uploadedFiles.length} gambar → ${pdfDoc.getPageCount()} halaman`,
    [{ label:"Unduh PDF", blob: new Blob([bytes], { type:"application/pdf" }), filename:"gambar.pdf" }]);
}

/** Render setiap halaman PDF menjadi gambar JPG. */
async function pdf2img() {
  if (!window.pdfjsLib) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const scale  = parseFloat(document.querySelector('input[name="pdf-scale"]:checked').value);
  const buf    = await uploadedFiles[0].arrayBuffer();
  const pdf    = await pdfjsLib.getDocument({ data: buf }).promise;
  const total  = pdf.numPages;
  const canvas = document.getElementById("work-canvas");
  const ctx    = canvas.getContext("2d");
  const downloads = [];
  for (let i = 1; i <= total; i++) {
    setProgress(10 + Math.round((i / total) * 85));
    const page = await pdf.getPage(i);
    const vp   = page.getViewport({ scale });
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.92));
    downloads.push({ label:`Hal.${i}`, blob, filename:`halaman_${i}.jpg` });
  }
  showResult("PDF berhasil dikonversi!", `${total} halaman → ${total} file JPG`, downloads);
}

// ════════════════════════════════════════════════════════════
// TOOLS GAMBAR
// ════════════════════════════════════════════════════════════

/** Konversi format gambar (JPG/PNG/WEBP). */
async function imgconvert() {
  const file = uploadedFiles[0];
  const fmt  = document.querySelector('input[name="imgfmt"]:checked').value;
  const ext  = fmt === "image/jpeg" ? "jpg" : fmt.split("/")[1];
  setProgress(40);
  const blob = await canvasConvert(file, fmt, 0.93);
  setProgress(95);
  const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
  showResult("Format berhasil dikonversi!", `${escHtml(file.name)} → ${ext.toUpperCase()}`,
    [{ label:`Unduh ${ext.toUpperCase()}`, blob, filename: name }]);
}

/** Kompres gambar dengan kualitas yang dapat disetel. */
async function compress() {
  const file    = uploadedFiles[0];
  const quality = parseInt(document.getElementById("compress-quality").value) / 100;
  setProgress(40);
  const blob  = await canvasConvert(file, "image/jpeg", quality);
  setProgress(95);
  const saved = Math.round((1 - blob.size / file.size) * 100);
  const name  = file.name.replace(/\.[^.]+$/, "") + "_terkompres.jpg";
  showResult("Gambar berhasil dikompres!", `${fmtSize(file.size)} → ${fmtSize(blob.size)} (hemat ${saved}%)`,
    [{ label:"Unduh JPG", blob, filename: name }]);
}

/** Ubah ukuran dimensi gambar. */
async function resize() {
  const file = uploadedFiles[0];
  const newW = parseInt(document.getElementById("resize-w").value);
  const newH = parseInt(document.getElementById("resize-h").value) || 0;
  if (!newW || newW < 1 || newW > 10000) { showToast("Masukkan lebar yang valid (1–10000 px)!", "error"); return; }
  const bm     = await createImageBitmap(file);
  const finalH = newH || Math.round(newW * (bm.height / bm.width));
  const canvas = document.getElementById("work-canvas");
  canvas.width = newW; canvas.height = finalH;
  canvas.getContext("2d").drawImage(bm, 0, 0, newW, finalH);
  setProgress(80);
  const ext  = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise(res => canvas.toBlob(res, ext, 0.93));
  const name = file.name.replace(/\.[^.]+$/, "") + `_${newW}x${finalH}.` + (ext === "image/png" ? "png" : "jpg");
  showResult("Gambar berhasil diubah ukurannya!", `${bm.width}×${bm.height} → ${newW}×${finalH}px`,
    [{ label:"Unduh", blob, filename: name }]);
}

// ── Crop ─────────────────────────────────────────────────

let cropData = null;

/**
 * Inisialisasi UI crop interaktif dengan drag & drop visual.
 * @param {string} url - Object URL gambar
 */
function initCrop(url) {
  cropData = null;
  const wrap = document.getElementById("crop-wrap");
  const img  = document.getElementById("crop-img");
  const sel  = document.getElementById("crop-select");
  wrap.style.display = "block";
  img.src = url;
  document.getElementById("img-source-preview-wrap").style.display = "none";
  document.getElementById("crop-coords-label").textContent = "Seret di atas gambar untuk memilih area potong";

  let startX, startY, dragging = false;

  function getRelPos(e) {
    const rect = img.getBoundingClientRect();
    const cx   = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const cy   = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x: Math.max(0, Math.min(cx, rect.width)), y: Math.max(0, Math.min(cy, rect.height)), rw: rect.width, rh: rect.height };
  }

  function onDown(e) { e.preventDefault(); const p = getRelPos(e); startX = p.x; startY = p.y; dragging = true; sel.style.display = "none"; }
  function onMove(e) {
    if (!dragging) return; e.preventDefault();
    const p = getRelPos(e);
    const x = Math.min(startX, p.x), y = Math.min(startY, p.y);
    const w = Math.abs(p.x - startX), h = Math.abs(p.y - startY);
    sel.style.cssText += `;left:${x}px;top:${y}px;width:${w}px;height:${h}px;display:block`;
  }
  function onUp(e) {
    if (!dragging) return; dragging = false;
    const rect   = img.getBoundingClientRect();
    const scaleX = img.naturalWidth  / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const sx = parseFloat(sel.style.left)   * scaleX;
    const sy = parseFloat(sel.style.top)    * scaleY;
    const sw = parseFloat(sel.style.width)  * scaleX;
    const sh = parseFloat(sel.style.height) * scaleY;
    if (sw > 5 && sh > 5) {
      cropData = { sx, sy, sw, sh };
      document.getElementById("crop-coords-label").textContent =
        `Seleksi: ${Math.round(sw)}×${Math.round(sh)}px`;
    }
  }

  img.addEventListener("mousedown",  onDown);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup",   onUp);
  img.addEventListener("touchstart", onDown, { passive:false });
  document.addEventListener("touchmove",  onMove, { passive:false });
  document.addEventListener("touchend",   onUp);
}

/** Eksekusi pemotongan gambar sesuai seleksi. */
async function cropImg() {
  if (!cropData) { showToast("Pilih area potong dengan menyeret di gambar!", "error"); return; }
  const { sx, sy, sw, sh } = cropData;
  const file   = uploadedFiles[0];
  const bitmap = await createImageBitmap(file);
  const canvas = document.getElementById("work-canvas");
  canvas.width = Math.round(sw); canvas.height = Math.round(sh);
  canvas.getContext("2d").drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
  setProgress(80);
  const ext  = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise(res => canvas.toBlob(res, ext, 0.93));
  const name = file.name.replace(/\.[^.]+$/, "") + `_terpotong.` + (ext === "image/png" ? "png" : "jpg");
  showResult("Gambar berhasil dipotong!", `${Math.round(sw)}×${Math.round(sh)}px`,
    [{ label:"Unduh", blob, filename: name }]);
}

/** Putar atau balik (mirror) gambar. */
async function rotate_img() {
  const file = uploadedFiles[0];
  const deg  = parseInt(document.querySelector('input[name="ri-rot"]:checked').value);
  const flip = document.querySelector('input[name="ri-flip"]:checked').value;
  const bm   = await createImageBitmap(file);
  const canvas = document.getElementById("work-canvas");
  const rad  = deg * Math.PI / 180;
  const swap = deg === 90 || deg === 270;
  canvas.width  = swap ? bm.height : bm.width;
  canvas.height = swap ? bm.width  : bm.height;
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  if (flip === "h") ctx.scale(-1,  1);
  if (flip === "v") ctx.scale( 1, -1);
  ctx.drawImage(bm, -bm.width / 2, -bm.height / 2);
  setProgress(80);
  const ext  = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise(res => canvas.toBlob(res, ext, 0.93));
  const name = file.name.replace(/\.[^.]+$/, "") + `_diputar.` + (ext === "image/png" ? "png" : "jpg");
  showResult("Gambar berhasil diproses!", "", [{ label:"Unduh", blob, filename: name }]);
}

/** Pratinjau live penyesuaian kecerahan/kontras/saturasi. */
function previewAdjust() {
  const img = window._adjImg;
  if (!img) return;
  const br = parseInt(document.getElementById("adj-brightness").value);
  const ct = parseInt(document.getElementById("adj-contrast").value);
  const st = parseInt(document.getElementById("adj-saturation").value);
  const pc = document.getElementById("adjust-preview-canvas");
  pc.width = img.naturalWidth; pc.height = img.naturalHeight;
  const ctx = pc.getContext("2d");
  ctx.filter = `brightness(${1+br/100}) contrast(${1+ct/100}) saturate(${1+st/100})`;
  ctx.drawImage(img, 0, 0);
  document.getElementById("adjust-preview-wrap").style.display = "block";
}

/** Terapkan penyesuaian kecerahan/kontras/saturasi ke file. */
async function adjustImg() {
  const file = uploadedFiles[0];
  const br   = parseInt(document.getElementById("adj-brightness").value);
  const ct   = parseInt(document.getElementById("adj-contrast").value);
  const st   = parseInt(document.getElementById("adj-saturation").value);
  const bm   = await createImageBitmap(file);
  const canvas = document.getElementById("work-canvas");
  canvas.width = bm.width; canvas.height = bm.height;
  const ctx = canvas.getContext("2d");
  ctx.filter = `brightness(${1+br/100}) contrast(${1+ct/100}) saturate(${1+st/100})`;
  ctx.drawImage(bm, 0, 0);
  setProgress(80);
  const ext  = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise(res => canvas.toBlob(res, ext, 0.93));
  const name = file.name.replace(/\.[^.]+$/, "") + "_disesuaikan." + (ext === "image/png" ? "png" : "jpg");
  showResult("Gambar berhasil disesuaikan!", "", [{ label:"Unduh", blob, filename: name }]);
}

/** Ubah gambar menjadi skala abu-abu. */
async function grayscale() {
  const file = uploadedFiles[0];
  const bm   = await createImageBitmap(file);
  const canvas = document.getElementById("work-canvas");
  canvas.width = bm.width; canvas.height = bm.height;
  const ctx = canvas.getContext("2d");
  ctx.filter = "grayscale(1)";
  ctx.drawImage(bm, 0, 0);
  setProgress(80);
  const ext  = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise(res => canvas.toBlob(res, ext, 0.93));
  const name = file.name.replace(/\.[^.]+$/, "") + "_abuabu." + (ext === "image/png" ? "png" : "jpg");
  showResult("Gambar berhasil diubah ke abu-abu!", `${fmtSize(file.size)} → ${fmtSize(blob.size)}`,
    [{ label:"Unduh", blob, filename: name }]);
}

/** Tambahkan efek blur ke gambar. */
async function blurImg() {
  const file   = uploadedFiles[0];
  const amount = parseInt(document.getElementById("blur-amount").value);
  const bm     = await createImageBitmap(file);
  const canvas = document.getElementById("work-canvas");
  canvas.width = bm.width; canvas.height = bm.height;
  const ctx = canvas.getContext("2d");
  ctx.filter = `blur(${amount}px)`;
  ctx.drawImage(bm, 0, 0);
  setProgress(80);
  const ext  = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise(res => canvas.toBlob(res, ext, 0.93));
  const name = file.name.replace(/\.[^.]+$/, "") + "_blur." + (ext === "image/png" ? "png" : "jpg");
  showResult("Efek blur berhasil diterapkan!", "", [{ label:"Unduh", blob, filename: name }]);
}

/** Pratinjau live tanda air pada gambar. */
function previewWatermarkImg() {
  const img     = window._wmiImg;
  if (!img) return;
  const text    = sanitizeString(document.getElementById("wmi-text")?.value || "© Tanda Air", 80);
  const pos     = document.querySelector('input[name="wmi-pos"]:checked')?.value || "center";
  const opacity = parseInt(document.getElementById("wmi-opacity")?.value || 35) / 100;
  const pc      = document.getElementById("wmi-canvas");
  const maxW    = Math.min(img.naturalWidth, 600);
  const scale   = maxW / img.naturalWidth;
  pc.width  = img.naturalWidth  * scale;
  pc.height = img.naturalHeight * scale;
  const ctx = pc.getContext("2d");
  ctx.drawImage(img, 0, 0, pc.width, pc.height);
  const fontSize = pc.width * 0.06;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle   = `rgba(255,255,255,${opacity})`;
  ctx.strokeStyle = `rgba(0,0,0,${opacity * 0.4})`;
  ctx.lineWidth = 2;
  ctx.textAlign    = pos === "center" ? "center" : (pos === "br" ? "right" : "left");
  ctx.textBaseline = pos === "center" ? "middle" : "bottom";
  const tx = pos === "center" ? pc.width/2 : (pos === "br" ? pc.width-16 : 16);
  const ty = pos === "center" ? pc.height/2 : pc.height-16;
  ctx.strokeText(text, tx, ty);
  ctx.fillText(text, tx, ty);
  document.getElementById("wmi-preview-wrap").style.display = "block";
}

/** Terapkan tanda air teks ke gambar. */
async function watermarkimg() {
  const file    = uploadedFiles[0];
  const text    = sanitizeString(document.getElementById("wmi-text").value || "© Tanda Air", 80);
  const pos     = document.querySelector('input[name="wmi-pos"]:checked').value;
  const opacity = parseInt(document.getElementById("wmi-opacity").value) / 100;
  const bm      = await createImageBitmap(file);
  const canvas  = document.getElementById("work-canvas");
  canvas.width = bm.width; canvas.height = bm.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bm, 0, 0);
  const fontSize = bm.width * 0.06;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle   = `rgba(255,255,255,${opacity})`;
  ctx.strokeStyle = `rgba(0,0,0,${opacity * 0.4})`;
  ctx.lineWidth = 3;
  ctx.textAlign    = pos === "center" ? "center" : (pos === "br" ? "right" : "left");
  ctx.textBaseline = pos === "center" ? "middle" : "bottom";
  const tx = pos === "center" ? bm.width/2 : (pos === "br" ? bm.width-24 : 24);
  const ty = pos === "center" ? bm.height/2 : bm.height-24;
  ctx.strokeText(text, tx, ty);
  ctx.fillText(text, tx, ty);
  setProgress(80);
  const ext  = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise(res => canvas.toBlob(res, ext, 0.93));
  const name = file.name.replace(/\.[^.]+$/, "") + "_tanda_air." + (ext === "image/png" ? "png" : "jpg");
  showResult("Tanda air berhasil ditambahkan!", "", [{ label:"Unduh", blob, filename: name }]);
}

/** Baca metadata EXIF dari gambar JPEG dan buat versi tanpa EXIF. */
async function exifTool() {
  const file = uploadedFiles[0];
  setProgress(30);
  const buf  = await file.arrayBuffer();
  const view = new DataView(buf);
  let exifData = {};
  try { exifData = parseBasicExif(view); } catch(_) {}
  setProgress(60);

  const optDiv = document.getElementById("tool-options");
  if (Object.keys(exifData).length === 0) {
    optDiv.innerHTML += `<div class="info-row" style="border:none"><span class="info-label">Tidak ada data EXIF ditemukan di file ini.</span></div>`;
  } else {
    const rows = Object.entries(exifData).map(([k, v]) =>
      `<tr><td style="color:var(--text2);font-size:11px">${escHtml(k)}</td><td>${escHtml(String(v))}</td></tr>`).join("");
    optDiv.innerHTML += `
      <p style="font-size:12px;color:var(--text2);margin-top:12px;margin-bottom:6px">Data EXIF yang ditemukan:</p>
      <div style="overflow-x:auto;max-height:220px;overflow-y:auto">
        <table class="exif-table"><thead><tr><th>Tag</th><th>Nilai</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  }

  const bm     = await createImageBitmap(file);
  const canvas = document.getElementById("work-canvas");
  canvas.width = bm.width; canvas.height = bm.height;
  canvas.getContext("2d").drawImage(bm, 0, 0);
  const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.95));
  const name = file.name.replace(/\.[^.]+$/, "") + "_tanpa_exif.jpg";
  setProgress(95);
  showResult("EXIF berhasil dibaca!",
    Object.keys(exifData).length > 0
      ? `${Object.keys(exifData).length} tag ditemukan. Unduh versi bersih tanpa EXIF:`
      : "Tidak ada EXIF. Unduh versi bersih:",
    [{ label:"Unduh Tanpa EXIF", blob, filename: name }]);
}

/**
 * Parse metadata EXIF dasar dari DataView JPEG.
 * @param {DataView} view
 * @returns {Record<string,string|number>}
 */
function parseBasicExif(view) {
  const result = {};
  if (view.getUint16(0) !== 0xFFD8) return result;
  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint8(offset) !== 0xFF) break;
    const marker = view.getUint16(offset);
    const length = view.getUint16(offset + 2);
    if (marker === 0xFFE1) {
      const exifHeader = String.fromCharCode(...new Uint8Array(view.buffer, offset + 4, 4));
      if (exifHeader === "Exif") {
        const tiffOffset   = offset + 10;
        const littleEndian = view.getUint16(tiffOffset) === 0x4949;
        const ifd0         = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
        const tagCount     = view.getUint16(ifd0, littleEndian);
        const tagNames = {
          0x010F:"Make", 0x0110:"Model", 0x0112:"Orientation",
          0x0131:"Software", 0x0132:"DateTime", 0x013B:"Artist",
          0xA002:"LebarPixel", 0xA003:"TinggiPixel",
          0x9003:"WaktuAsli", 0x9004:"WaktuDigital",
          0x010E:"Deskripsi", 0x8298:"Hak Cipta",
        };
        for (let i = 0; i < tagCount; i++) {
          const tagOffset = ifd0 + 2 + (i * 12);
          const tag   = view.getUint16(tagOffset, littleEndian);
          const type  = view.getUint16(tagOffset + 2, littleEndian);
          const count = view.getUint32(tagOffset + 4, littleEndian);
          if (tagNames[tag]) {
            try {
              let val = "";
              if (type === 2) {
                const strOffset = count <= 4 ? tagOffset + 8 : tiffOffset + view.getUint32(tagOffset + 8, littleEndian);
                for (let c = 0; c < count - 1; c++) val += String.fromCharCode(view.getUint8(strOffset + c));
              } else if (type === 3) { val = view.getUint16(tagOffset + 8, littleEndian); }
              else if (type === 4) { val = view.getUint32(tagOffset + 8, littleEndian); }
              else if (type === 5) {
                const rOff = tiffOffset + view.getUint32(tagOffset + 8, littleEndian);
                val = view.getUint32(rOff, littleEndian) + "/" + view.getUint32(rOff + 4, littleEndian);
              }
              if (val !== "" && val !== 0) result[tagNames[tag]] = val;
            } catch(_) {}
          }
        }
      }
    }
    offset += 2 + length;
  }
  return result;
}

/** Encode gambar ke string Base64. */
async function base64img() {
  const file = uploadedFiles[0];
  setProgress(40);
  const b64 = await new Promise(res => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.readAsDataURL(file);
  });
  setProgress(90);
  const blob    = new Blob([b64], { type:"text/plain" });
  const name    = file.name.replace(/\.[^.]+$/, "") + "_base64.txt";
  const snippet = b64.substring(0, 120) + "...";
  document.getElementById("tool-options").innerHTML += `
    <div style="margin-top:12px">
      <p style="font-size:12px;color:var(--text2);margin-bottom:6px">Pratinjau (${fmtSize(b64.length)}):</p>
      <code style="font-size:10px;color:var(--accent2);background:var(--bg);padding:10px;border-radius:6px;display:block;word-break:break-all;line-height:1.5">${escHtml(snippet)}</code>
      <button class="btn btn-secondary" style="margin-top:8px;font-size:12px"
        onclick="navigator.clipboard.writeText(document.getElementById('b64-full').value).then(()=>showToast('Base64 disalin ✓'))">
        📋 Salin ke Papan Klip
      </button>
      <textarea id="b64-full" style="display:none">${escHtml(b64)}</textarea>
    </div>`;
  showResult("Gambar berhasil di-encode!", `${fmtSize(file.size)} → Base64 (${fmtSize(b64.length)})`,
    [{ label:"Unduh TXT", blob, filename: name }]);
}

/** Gabungkan beberapa gambar menjadi satu kanvas. */
async function mergeimg() {
  if (uploadedFiles.length < 2) { showToast("Unggah minimal 2 gambar", "error"); return; }
  const dir  = document.querySelector('input[name="merge-dir"]:checked').value;
  const gap  = Math.min(200, Math.max(0, parseInt(document.getElementById("merge-gap").value) || 0));
  const bitmaps = [];
  for (const f of uploadedFiles) bitmaps.push(await createImageBitmap(f));
  setProgress(50);
  const canvas = document.getElementById("work-canvas");
  if (dir === "h") {
    canvas.width  = bitmaps.reduce((s, b) => s + b.width, 0)  + gap * (bitmaps.length - 1);
    canvas.height = Math.max(...bitmaps.map(b => b.height));
  } else {
    canvas.width  = Math.max(...bitmaps.map(b => b.width));
    canvas.height = bitmaps.reduce((s, b) => s + b.height, 0) + gap * (bitmaps.length - 1);
  }
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let cur = 0;
  for (const bm of bitmaps) {
    if (dir === "h") { ctx.drawImage(bm, cur, 0); cur += bm.width  + gap; }
    else             { ctx.drawImage(bm, 0, cur); cur += bm.height + gap; }
  }
  setProgress(85);
  const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.93));
  showResult("Gambar berhasil digabung!", `${bitmaps.length} gambar → ${canvas.width}×${canvas.height}px`,
    [{ label:"Unduh JPG", blob, filename:"gabungan_gambar.jpg" }]);
}

// ════════════════════════════════════════════════════════════
// TOOLS DOKUMEN
// ════════════════════════════════════════════════════════════

/** Konversi Markdown ke HTML. */
async function md2html() {
  const file = uploadedFiles[0];
  const text = await file.text();
  setProgress(40);
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^#{6}\s(.+)$/gm, "<h6>$1</h6>")
    .replace(/^#{5}\s(.+)$/gm, "<h5>$1</h5>")
    .replace(/^#{4}\s(.+)$/gm, "<h4>$1</h4>")
    .replace(/^###\s(.+)$/gm,  "<h3>$1</h3>")
    .replace(/^##\s(.+)$/gm,   "<h2>$1</h2>")
    .replace(/^#\s(.+)$/gm,    "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/`(.+?)`/g,       "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^---$/gm, "<hr>")
    .replace(/^[-*]\s(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
  html = "<p>" + html + "</p>";

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(file.name.replace(".md",""))}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;line-height:1.7;color:#1a1a2e}
  h1,h2,h3{line-height:1.3;margin-top:1.8em}
  h1{font-size:2em;border-bottom:2px solid #eee;padding-bottom:.3em}
  h2{font-size:1.5em;border-bottom:1px solid #f0f0f0;padding-bottom:.2em}
  code{background:#f4f4f8;padding:2px 6px;border-radius:4px;font-size:.9em}
  a{color:#7c6aff} hr{border:none;border-top:1px solid #eee;margin:2em 0}
  ul{padding-left:1.5em} li{margin:.3em 0}
</style>
</head><body>${html}</body></html>`;

  setProgress(90);
  const blob = new Blob([fullHtml], { type:"text/html;charset=utf-8" });
  const name = file.name.replace(/\.[^.]+$/, "") + ".html";
  showResult("Markdown berhasil dikonversi ke HTML!", `${fmtSize(file.size)} → ${fmtSize(blob.size)}`,
    [{ label:"Unduh HTML", blob, filename: name }]);
}

/** Konversi CSV ↔ JSON. */
async function csv2json() {
  const file = uploadedFiles[0];
  const text = await file.text();
  const ext  = file.name.split(".").pop().toLowerCase();
  const mode = document.querySelector('input[name="cj-mode"]:checked').value;
  const actualMode = mode === "auto" ? (ext === "json" ? "json2csv" : "csv2json") : mode;
  setProgress(40);
  let blob, name, desc;

  if (actualMode === "csv2json") {
    const lines   = text.trim().split("\n").filter(Boolean);
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows    = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj  = {};
      headers.forEach((h, i) => { obj[h] = isNaN(vals[i]) ? vals[i] : Number(vals[i]); });
      return obj;
    });
    const json = JSON.stringify(rows, null, 2);
    blob = new Blob([json], { type:"application/json" });
    name = file.name.replace(/\.[^.]+$/, "") + ".json";
    desc = `${lines.length - 1} baris → JSON (${fmtSize(blob.size)})`;
  } else {
    const data    = JSON.parse(text);
    const arr     = Array.isArray(data) ? data : [data];
    const headers = [...new Set(arr.flatMap(r => Object.keys(r)))];
    const csv     = [
      headers.join(","),
      ...arr.map(r => headers.map(h => {
        const v = r[h] ?? "";
        return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
      }).join(",")),
    ].join("\n");
    blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
    name = file.name.replace(/\.[^.]+$/, "") + ".csv";
    desc = `${arr.length} objek → CSV (${fmtSize(blob.size)})`;
  }
  setProgress(90);
  showResult(`Konversi ${actualMode === "csv2json" ? "CSV → JSON" : "JSON → CSV"} selesai!`, desc,
    [{ label:`Unduh ${name.split(".").pop().toUpperCase()}`, blob, filename: name }]);
}

// ════════════════════════════════════════════════════════════
// SENI ASCII
// ════════════════════════════════════════════════════════════

const ASCII_CHARSETS = {
  detailed: ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'.split('').reverse(),
  simple:   ' .:-=+*#%@'.split('').reverse(),
  blocks:   ' ░▒▓█'.split('').reverse(),
  emoji:    ['  ','🌑','🌒','🌓','🌔','🌕'],
};

/** Konversi gambar menjadi seni ASCII. */
async function asciiArt() {
  const file    = uploadedFiles[0];
  const width   = Math.min(200, Math.max(40, parseInt(document.getElementById("ascii-width").value)));
  const charset = document.querySelector('input[name="ascii-charset"]:checked').value;
  const colored = document.querySelector('input[name="ascii-color"]:checked').value === "color";
  const invert  = document.getElementById("ascii-invert").checked;
  const chars   = ASCII_CHARSETS[charset];
  const bitmap  = await createImageBitmap(file);
  const canvas  = document.getElementById("work-canvas");
  const height  = Math.round(width * (bitmap.height / bitmap.width) * 0.45);
  canvas.width  = width;
  canvas.height = height;
  const ctx     = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  setProgress(60);

  const output = document.getElementById("ascii-output-pre");

  if (colored) {
    let html = "";
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i  = (y * width + x) * 4;
        const r  = pixels[i], g = pixels[i+1], b = pixels[i+2];
        const br = (0.299*r + 0.587*g + 0.114*b) / 255;
        const ch = chars[Math.floor(br * (chars.length - 1))];
        html += `<span style="color:rgb(${r},${g},${b})">${ch}</span>`;
      }
      html += "\n";
    }
    output.innerHTML = html;
  } else {
    let text = "";
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i  = (y * width + x) * 4;
        let br   = (0.299*pixels[i] + 0.587*pixels[i+1] + 0.114*pixels[i+2]) / 255;
        if (invert) br = 1 - br;
        text += chars[Math.floor(br * (chars.length - 1))];
      }
      text += "\n";
    }
    output.textContent = text;
  }

  setProgress(90);
  document.getElementById("ascii-result-wrap").style.display = "block";
  const rawText = output.textContent || output.innerText;
  const txtBlob = new Blob([rawText], { type:"text/plain" });
  const pngBlob = await asciiToPng(output, invert, colored);
  showResult("Seni ASCII berhasil dibuat!", `${width} kolom × ${height} baris`, [
    { label:"Unduh TXT", blob: txtBlob, filename:"seni-ascii.txt" },
    { label:"Unduh PNG", blob: pngBlob, filename:"seni-ascii.png" },
  ]);
}

/**
 * Render output ASCII ke canvas dan kembalikan sebagai Blob PNG.
 * @param {HTMLPreElement} preEl
 * @param {boolean} invert
 * @param {boolean} colored
 * @returns {Promise<Blob>}
 */
async function asciiToPng(preEl, invert, colored) {
  const text  = preEl.textContent || preEl.innerText;
  const lines = text.split("\n");
  const FS = 11, LH = FS * 1.1, CW = FS * 0.605, PAD = 20;
  const maxCol = Math.max(...lines.map(l => l.length));
  const ec     = document.getElementById("work-canvas2");
  ec.width     = Math.round(maxCol * CW + PAD * 2);
  ec.height    = Math.round(lines.length * LH + PAD * 2);
  const ctx    = ec.getContext("2d");
  ctx.fillStyle = (invert && !colored) ? "#000" : "#fff";
  ctx.fillRect(0, 0, ec.width, ec.height);
  ctx.font = `${FS}px 'JetBrains Mono','Courier New',monospace`;
  ctx.textBaseline = "top";
  if (colored) {
    const spans = preEl.querySelectorAll("span");
    let si = 0;
    for (let y = 0; y < lines.length; y++) {
      for (let x = 0; x < lines[y].length; x++) {
        const sp = spans[si++];
        if (sp) { ctx.fillStyle = sp.style.color || "#000"; ctx.fillText(sp.textContent, PAD + x*CW, PAD + y*LH); }
      }
    }
  } else {
    ctx.fillStyle = invert ? "#e8e8e8" : "#111";
    for (let y = 0; y < lines.length; y++) ctx.fillText(lines[y], PAD, PAD + y*LH);
  }
  return new Promise(res => ec.toBlob(res, "image/png"));
}

/** Salin output ASCII ke papan klip. */
function asciiCopy() {
  const out = document.getElementById("ascii-output-pre");
  navigator.clipboard.writeText(out.textContent || out.innerText)
    .then(() => showToast("Disalin ke papan klip ✓"))
    .catch(() => showToast("Gagal menyalin", "error"));
}

/** Salin output ASCII dengan format code block untuk WhatsApp. */
function asciiCopyWA() {
  const out = document.getElementById("ascii-output-pre");
  const raw = out.textContent || out.innerText;
  navigator.clipboard.writeText("```\n" + raw.trimEnd() + "\n```")
    .then(() => showToast("Disalin untuk WhatsApp ✓"))
    .catch(() => showToast("Gagal menyalin", "error"));
}

// ════════════════════════════════════════════════════════════
// FUNGSI UTILITAS
// ════════════════════════════════════════════════════════════

/**
 * Parse string rentang halaman seperti "1-3, 5, 7-9".
 * @param {string} str
 * @param {number} total - Total halaman dalam dokumen
 * @returns {number[][]} Array dari array indeks halaman (0-based)
 */
function parseRanges(str, total) {
  const parts = str.split(",").map(s => s.trim()).filter(Boolean);
  const result = [];
  for (const p of parts) {
    const m = p.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return [];
    const a = parseInt(m[1]) - 1;
    const b = m[2] ? parseInt(m[2]) - 1 : a;
    if (a < 0 || b >= total || a > b) return [];
    const pages = [];
    for (let i = a; i <= b; i++) pages.push(i);
    result.push(pages);
  }
  return result;
}

/**
 * Konversi gambar ke format lain via Canvas.
 * @param {File} file
 * @param {string} mimeType
 * @param {number} quality - 0.0–1.0
 * @returns {Promise<Blob>}
 */
async function canvasConvert(file, mimeType, quality) {
  const bm = await createImageBitmap(file);
  const c  = document.getElementById("work-canvas");
  c.width = bm.width; c.height = bm.height;
  c.getContext("2d").drawImage(bm, 0, 0);
  return new Promise(res => c.toBlob(res, mimeType, quality));
}

/**
 * Muat script eksternal secara dinamis.
 * @param {string} src - URL script
 * @returns {Promise<void>}
 */
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

/**
 * Format ukuran file ke string yang mudah dibaca.
 * @param {number} b - Ukuran dalam byte
 * @returns {string}
 */
function fmtSize(b) {
  if (b < 1024)      return b + " B";
  if (b < 1048576)   return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(2) + " MB";
}

/**
 * Escape karakter HTML untuk mencegah XSS.
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Drag & Drop ke upload zone ────────────────────────────
(function initDragDrop() {
  const dz = document.getElementById("panel-dropzone");
  if (!dz) return;
  dz.addEventListener("dragover",  e => { e.preventDefault(); dz.classList.add("drag-over"); });
  dz.addEventListener("dragleave", ()  => dz.classList.remove("drag-over"));
  dz.addEventListener("drop",      e  => {
    e.preventDefault();
    dz.classList.remove("drag-over");
    handlePanelFiles(e.dataTransfer.files);
  });
})();

// ── Inisialisasi halaman ──────────────────────────────────
(function initConverterPage() {
  // inisialisasi sudah di awal file
})();
