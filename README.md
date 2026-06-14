# UcupzConvert

Web app konversi file dengan login Google, dilengkapi tools PDF, Gambar, QR Code, dan Berbagi File P2P.

## Struktur File

```
ucupzconvert/
├── index.html              ← Halaman login Google
├── 404.html                ← Halaman error 404
├── manifest.json           ← PWA manifest (bisa di-install)
├── favicon.svg             ← Favicon sumber (SVG scalable)
├── generate-favicons.js    ← Script generate favicon PNG semua ukuran
├── pages/
│   ├── profil.html         ← Profil pengguna (bisa diedit)
│   ├── converter.html      ← 25+ tools konversi PDF & gambar
│   ├── qrcode.html         ← Generator QR Code
│   ├── share.html          ← Berbagi file P2P (WebRTC)
│   └── setting.html        ← Pengaturan tampilan & data
├── css/
│   ├── style.css           ← Reset, variabel, layout, sidebar, skeleton
│   └── pages.css           ← Komponen tiap halaman (dipindah dari inline)
├── js/
│   ├── config.js           ← Konstanta & konfigurasi global
│   ├── auth.js             ← Login Google, verifikasi server, sesi, logout
│   ├── ui.js               ← Sidebar, navbar mobile, toast, transisi halaman
│   └── pages/
│       └── converter.js    ← Logika semua tools converter
├── api/
│   └── auth.js             ← Vercel Serverless Function: verifikasi token Google
├── vercel.json             ← Deploy config + CSP + routing 404
├── .env.example            ← Template variabel environment
└── .gitignore
```

---

## Setup Awal

### 1. Salin file environment

```bash
cp .env.example .env
```

Isi `.env` dengan nilai yang sesuai:

```env
GOOGLE_CLIENT_ID=438xxxxxx.apps.googleusercontent.com
APP_URL=https://nama-app.vercel.app
```

### 2. Ganti Client ID di `index.html`

Buka `index.html`, cari baris:

```html
<meta name="google-client-id" content="GANTI_DENGAN_CLIENT_ID_KAMU" />
```

Ganti nilainya dengan Client ID Google kamu.

### 3. Generate favicon

```bash
npm install sharp
node generate-favicons.js
```

Atau buat manual di [favicon.io](https://favicon.io) dan rename hasilnya:
- `favicon-16.png`, `favicon-32.png`, `favicon-180.png`, `favicon-192.png`, `favicon-512.png`

### 4. Jalankan lokal

```bash
npm install -g serve
serve . -p 3000
```

Buka: `http://localhost:3000`

---

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/username/ucupzconvert.git
git push -u origin main
```

### 2. Deploy

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Set Environment Variable di Vercel Dashboard

Buka **Vercel Dashboard → Project → Settings → Environment Variables**, tambahkan:

| Nama               | Nilai                                          |
|--------------------|------------------------------------------------|
| `GOOGLE_CLIENT_ID` | `438xxxxxx.apps.googleusercontent.com`         |
| `APP_URL`          | `https://nama-app.vercel.app`                  |

### 4. Tambahkan domain di Google Cloud Console

**Google Cloud Console → APIs & Services → Credentials → OAuth Client → Edit:**

- **Authorized JavaScript origins:** `https://nama-app.vercel.app`
- **Authorized redirect URIs:** (kosong untuk GSI)

---

## Fitur

| Fitur | Keterangan |
|-------|-----------|
| 🔐 Login Google | OAuth 2.0 via GSI + verifikasi token di server |
| ⏱ Sesi otomatis | Logout setelah 24 jam tidak aktif, dengan peringatan 15 menit sebelumnya |
| 👤 Profil | Nama, bio, lokasi, situs web — tersimpan di localStorage |
| 🔄 Converter | 25+ tools: PDF (gabung/pisah/putar/kompres/dll), gambar (crop/resize/blur/dll), dokumen |
| 📲 QR Code | Buat QR dari URL/teks/WiFi/WA/surel + kustomisasi warna & logo |
| 📡 Berbagi File | P2P terenkripsi via WebRTC (PeerJS), tidak ada file tersimpan di server |
| ⚙️ Pengaturan | Mode gelap/terang, manajemen data lokal |
| 📦 PWA | Bisa di-install sebagai aplikasi di HP/desktop |

---

## Keamanan yang Diterapkan

### Token Verification (server-side)
Token Google tidak lagi di-decode secara langsung di browser (`atob()`).  
Sekarang dikirim ke endpoint `/api/auth` dan diverifikasi ke Google API:

```
Browser → POST /api/auth { credential } → Google tokeninfo API → ✓ valid → simpan user
```

### Content Security Policy
Header CSP ketat dikonfigurasi di `vercel.json` — hanya domain yang diperlukan yang diizinkan.

### Session Expiry
- Sesi aktif selama **24 jam** sejak login terakhir
- Peringatan banner muncul **15 menit** sebelum expired
- Tombol "Perpanjang Sesi" tersedia di halaman Pengaturan

### Input Sanitization
Semua input dari pengguna disanitasi sebelum disimpan:
- `sanitizeString(str, maxLen)` — hapus karakter `< > " ' \``
- `sanitizeUrl(url)` — hanya izinkan `http://` dan `https://`

### localStorage Bersih
Hanya key yang terdaftar di `STORAGE_KEYS` (config.js) yang boleh ada.  
Key tidak dikenal dihapus otomatis saat halaman dibuka.

---

## Catatan Penting

> **Password PDF** — `pdf-lib` versi gratis tidak mendukung enkripsi penuh.  
> Untuk enkripsi PDF nyata, diperlukan library premium atau solusi server-side.

> **Skeleton loading** — Konten converter disembunyikan sampai JS selesai dimuat untuk pengalaman yang lebih baik di koneksi lambat.
