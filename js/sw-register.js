// ============================================================
// js/sw-register.js — Registrasi Service Worker + notif update
// Include di semua halaman HTML sebelum </body>
// ============================================================

(function () {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

      // Cek update setiap 60 menit
      setInterval(() => reg.update(), 60 * 60 * 1000);

      // Deteksi ada Service Worker baru menunggu
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // SW baru sudah siap tapi belum aktif
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateBanner(newWorker);
          }
        });
      });

    } catch (err) {
      console.warn("[SW] Registrasi gagal:", err);
    }
  });

  /**
   * Tampilkan banner notifikasi update tersedia.
   * @param {ServiceWorker} worker
   */
  function showUpdateBanner(worker) {
    // Jangan tampilkan duplikat
    if (document.getElementById("sw-update-banner")) return;

    const banner = document.createElement("div");
    banner.id = "sw-update-banner";
    banner.style.cssText = [
      "position:fixed", "bottom:80px", "left:50%",
      "transform:translateX(-50%)",
      "z-index:99999",
      "background:rgba(22,22,42,0.97)",
      "border:1px solid rgba(124,106,255,0.4)",
      "border-radius:12px",
      "padding:14px 20px",
      "display:flex", "align-items:center", "gap:14px",
      "box-shadow:0 8px 32px rgba(0,0,0,0.5)",
      "font-family:var(--font-body,sans-serif)",
      "font-size:13px",
      "color:#eeedf8",
      "max-width:320px",
      "width:calc(100% - 48px)",
      "backdrop-filter:blur(12px)",
    ].join(";");

    banner.innerHTML = `
      <span style="font-size:20px">✦</span>
      <div style="flex:1">
        <p style="font-weight:600;color:#b8abff;margin-bottom:2px">Update tersedia!</p>
        <p style="font-size:12px;color:#8887a4">Versi baru UcupzConvert siap digunakan.</p>
      </div>
      <button id="sw-update-btn" style="
        background:#7c6aff;color:#fff;border:none;border-radius:8px;
        padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;
        white-space:nowrap;font-family:inherit;flex-shrink:0;
      ">Perbarui</button>
      <button id="sw-dismiss-btn" style="
        background:none;border:none;color:#4a4962;cursor:pointer;
        font-size:18px;padding:0 2px;line-height:1;flex-shrink:0;
      ">✕</button>
    `;

    document.body.appendChild(banner);

    // Tombol perbarui — aktifkan SW baru dan reload
    document.getElementById("sw-update-btn").onclick = () => {
      worker.postMessage("SKIP_WAITING");
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    };

    // Tombol tutup banner
    document.getElementById("sw-dismiss-btn").onclick = () => {
      banner.remove();
    };

    // Auto hilang setelah 30 detik
    setTimeout(() => { if (banner.parentNode) banner.remove(); }, 30000);
  }
})();
