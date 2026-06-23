// ============================================================
// js/onboarding.js — Onboarding singkat untuk user baru
// Include di semua halaman app setelah ui.js
// ============================================================

(function () {
  const ONBOARDING_KEY = "onboarding_done";

  const steps = [
    {
      icon: "🔄",
      title: "Converter Serba Bisa",
      desc: "25+ tools PDF & gambar — kompres, putar, gabung, potong, watermark, dan masih banyak lagi. Semua proses di browser, file kamu tidak pernah dikirim ke server.",
      hint: "Coba ketik nama tool di kolom pencarian!",
    },
    {
      icon: "📲",
      title: "Generator QR Code",
      desc: "Buat QR Code dari URL, teks, WiFi, WhatsApp, atau surel. Kustomisasi warna, tambah logo, dan unduh dalam format PNG atau SVG.",
      hint: "QR Code dibuat otomatis saat kamu mengetik.",
    },
    {
      icon: "📡",
      title: "Berbagi File P2P",
      desc: "Transfer file langsung antar browser tanpa upload ke server. Cukup bagikan kode 6 karakter ke penerima — aman dan terenkripsi.",
      hint: "Kedua browser harus terbuka selama transfer.",
    },
  ];

  let currentStep = 0;

  function shouldShow() {
    try {
      return !localStorage.getItem(ONBOARDING_KEY);
    } catch (_) {
      return false;
    }
  }

  function markDone() {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch (_) {}
  }

  function injectStyles() {
    if (document.getElementById("onboarding-style")) return;
    const style = document.createElement("style");
    style.id = "onboarding-style";
    style.textContent = `
      #onboarding-overlay {
        position: fixed;
        inset: 0;
        z-index: 99997;
        background: rgba(8, 8, 15, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      #onboarding-overlay.show {
        opacity: 1;
        visibility: visible;
      }

      #onboarding-card {
        background: #13132a;
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: 24px;
        padding: 40px 36px 32px;
        max-width: 420px;
        width: 100%;
        text-align: center;
        box-shadow:
          0 40px 80px rgba(0,0,0,0.6),
          0 0 0 1px rgba(124,106,255,0.15),
          inset 0 1px 0 rgba(255,255,255,0.06);
        transform: scale(0.9) translateY(20px);
        transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
      }
      #onboarding-overlay.show #onboarding-card {
        transform: scale(1) translateY(0);
      }

      /* Glow top border */
      #onboarding-card::before {
        content: '';
        position: absolute;
        top: -1px; left: 20%; right: 20%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(124,106,255,0.7), transparent);
      }

      /* Background decoration */
      #onboarding-card::after {
        content: '';
        position: absolute;
        top: -60px; right: -60px;
        width: 200px; height: 200px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(124,106,255,0.08) 0%, transparent 70%);
        pointer-events: none;
      }

      .onboarding-skip {
        position: absolute;
        top: 16px; right: 16px;
        background: none;
        border: none;
        color: var(--text3, #4a4962);
        font-size: 12px;
        cursor: pointer;
        font-family: var(--font-body, sans-serif);
        padding: 4px 8px;
        border-radius: 6px;
        transition: color 0.18s ease, background 0.18s ease;
      }
      .onboarding-skip:hover {
        color: var(--text2, #8887a4);
        background: rgba(255,255,255,0.05);
      }

      .onboarding-step-icon {
        width: 72px;
        height: 72px;
        border-radius: 20px;
        background: rgba(124,106,255,0.10);
        border: 1px solid rgba(124,106,255,0.20);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        margin: 0 auto 20px;
        box-shadow: 0 0 32px rgba(124,106,255,0.12);
        transition: transform 0.2s ease;
      }

      .onboarding-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--accent2, #b8abff);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 10px;
      }

      .onboarding-title {
        font-family: var(--font-head, 'Syne', sans-serif);
        font-size: 22px;
        font-weight: 700;
        color: var(--text, #eeedf8);
        margin-bottom: 12px;
        letter-spacing: -0.02em;
        line-height: 1.2;
      }

      .onboarding-desc {
        font-size: 14px;
        color: var(--text2, #8887a4);
        line-height: 1.65;
        margin-bottom: 16px;
      }

      .onboarding-hint {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--accent2, #b8abff);
        background: rgba(124,106,255,0.08);
        border: 1px solid rgba(124,106,255,0.15);
        border-radius: 20px;
        padding: 5px 12px;
        margin-bottom: 28px;
      }

      /* Step dots */
      .onboarding-dots {
        display: flex;
        gap: 6px;
        justify-content: center;
        margin-bottom: 24px;
      }
      .onboarding-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--text3, #4a4962);
        transition: all 0.25s ease;
        cursor: pointer;
      }
      .onboarding-dot.active {
        width: 20px;
        border-radius: 3px;
        background: var(--accent, #7c6aff);
      }

      /* Actions */
      .onboarding-actions {
        display: flex;
        gap: 10px;
      }
      .onboarding-btn-prev {
        padding: 11px 18px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.10);
        background: transparent;
        color: var(--text2, #8887a4);
        font-family: var(--font-body, sans-serif);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.18s ease;
        display: none;
      }
      .onboarding-btn-prev.visible { display: block; }
      .onboarding-btn-prev:hover {
        background: rgba(255,255,255,0.06);
        color: var(--text, #eeedf8);
      }

      .onboarding-btn-next {
        flex: 1;
        padding: 11px 18px;
        border-radius: 10px;
        border: none;
        background: var(--accent, #7c6aff);
        color: #fff;
        font-family: var(--font-body, sans-serif);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 20px rgba(124,106,255,0.35);
        position: relative;
        overflow: hidden;
      }
      .onboarding-btn-next:hover {
        opacity: 0.88;
        transform: translateY(-1px);
        box-shadow: 0 6px 24px rgba(124,106,255,0.45);
      }
      .onboarding-btn-next:active { transform: translateY(0); }

      /* Step transition */
      #onboarding-step-content {
        transition: opacity 0.18s ease, transform 0.18s ease;
      }
      #onboarding-step-content.fade-out {
        opacity: 0;
        transform: translateX(-16px);
      }
      #onboarding-step-content.fade-in-right {
        opacity: 0;
        transform: translateX(16px);
      }

      @media (max-width: 480px) {
        #onboarding-card { padding: 32px 20px 24px; border-radius: 18px; }
        .onboarding-title { font-size: 18px; }
        .onboarding-desc  { font-size: 13px; }
      }
    `;
    document.head.appendChild(style);
  }

  function render() {
    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;
    const isFirst = currentStep === 0;

    const contentEl = document.getElementById("onboarding-step-content");
    const iconEl    = document.querySelector(".onboarding-step-icon");
    const labelEl   = document.querySelector(".onboarding-label");
    const titleEl   = document.querySelector(".onboarding-title");
    const descEl    = document.querySelector(".onboarding-desc");
    const hintEl    = document.querySelector(".onboarding-hint");
    const nextEl    = document.querySelector(".onboarding-btn-next");
    const prevEl    = document.querySelector(".onboarding-btn-prev");

    if (iconEl)  iconEl.textContent  = step.icon;
    if (labelEl) labelEl.textContent = `Langkah ${currentStep + 1} dari ${steps.length}`;
    if (titleEl) titleEl.textContent = step.title;
    if (descEl)  descEl.textContent  = step.desc;
    if (hintEl)  hintEl.innerHTML    = `💡 ${step.hint}`;
    if (nextEl)  nextEl.textContent  = isLast ? "✦ Mulai Sekarang" : "Lanjut →";
    if (prevEl)  prevEl.classList.toggle("visible", !isFirst);

    // Update dots
    document.querySelectorAll(".onboarding-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentStep);
    });
  }

  function goTo(index, direction = "next") {
    const contentEl = document.getElementById("onboarding-step-content");
    if (!contentEl) return;

    contentEl.classList.add("fade-out");
    setTimeout(() => {
      currentStep = index;
      render();
      contentEl.classList.remove("fade-out");
      contentEl.classList.add(direction === "next" ? "fade-in-right" : "fade-in-left");
      // Force reflow
      contentEl.offsetHeight;
      contentEl.classList.remove("fade-in-right", "fade-in-left");
    }, 180);
  }

  function next() {
    if (currentStep < steps.length - 1) {
      goTo(currentStep + 1, "next");
    } else {
      close();
    }
  }

  function prev() {
    if (currentStep > 0) {
      goTo(currentStep - 1, "prev");
    }
  }

  function close() {
    const overlay = document.getElementById("onboarding-overlay");
    if (!overlay) return;
    overlay.classList.remove("show");
    document.body.style.overflow = "";
    markDone();
    setTimeout(() => overlay.remove(), 300);
  }

  function inject() {
    injectStyles();

    const dots = steps.map((_, i) =>
      `<div class="onboarding-dot${i === 0 ? " active" : ""}" onclick="window._onboardingGoTo(${i})"></div>`
    ).join("");

    const overlay = document.createElement("div");
    overlay.id = "onboarding-overlay";
    overlay.innerHTML = `
      <div id="onboarding-card">
        <button class="onboarding-skip" onclick="window._onboardingClose()">Lewati ✕</button>

        <div id="onboarding-step-content">
          <div class="onboarding-step-icon">${steps[0].icon}</div>
          <p class="onboarding-label">Langkah 1 dari ${steps.length}</p>
          <h2 class="onboarding-title">${steps[0].title}</h2>
          <p class="onboarding-desc">${steps[0].desc}</p>
          <p class="onboarding-hint">💡 ${steps[0].hint}</p>
        </div>

        <div class="onboarding-dots">${dots}</div>

        <div class="onboarding-actions">
          <button class="onboarding-btn-prev" onclick="window._onboardingPrev()">← Kembali</button>
          <button class="onboarding-btn-next" onclick="window._onboardingNext()">Lanjut →</button>
        </div>
      </div>
    `;

    // Tutup saat klik overlay
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.body.appendChild(overlay);

    // Expose ke global untuk onclick handler
    window._onboardingNext  = next;
    window._onboardingPrev  = prev;
    window._onboardingClose = close;
    window._onboardingGoTo  = (i) => goTo(i, i > currentStep ? "next" : "prev");

    // Tampilkan dengan delay kecil agar transisi halus
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("show");
        document.body.style.overflow = "hidden";
      });
    });
  }

  // Jalankan setelah DOM siap
  function init() {
    if (!shouldShow()) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", inject);
    } else {
      // Delay agar halaman selesai render dulu
      setTimeout(inject, 600);
    }
  }

  init();
})();
