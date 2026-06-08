# MyApp

Web app dengan login Google, dilengkapi fitur Profil, Converter file, dan Gambar to ASCII Art.

## Struktur File

```
myapp/
├── index.html              ← Halaman login Google
├── pages/
│   ├── profil.html         ← Profil user (bisa diedit)
│   ├── converter.html      ← Konversi format gambar & dokumen
│   ├── ascii.html          ← Gambar ke ASCII Art
│   └── setting.html        ← Pengaturan tampilan & data
├── css/
│   ├── style.css           ← Reset, variabel, login, sidebar, layout
│   └── pages.css           ← Komponen tiap halaman
├── js/
│   ├── auth.js             ← Google login, session, logout
│   └── ui.js               ← Sidebar renderer, toast notification
├── vercel.json             ← Konfigurasi deploy Vercel
├── .gitignore
└── README.md
```

## Setup

### 1. Isi Client ID Google
Ganti `GANTI_DENGAN_CLIENT_ID_KAMU` di:
- `index.html` → atribut `data-client_id`
- `js/auth.js` → variabel `GOOGLE_CLIENT_ID`

### 2. Jalankan lokal
```bash
npm install -g serve
serve . -p 3000
```
Buka: `http://localhost:3000`

### 3. Push ke GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/username/myapp.git
git push -u origin main
```

### 4. Deploy ke Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 5. Tambahkan domain Vercel ke Google Cloud
Di Google Cloud Console → Clients → edit:
- **Authorized JavaScript origins**: `https://nama-app.vercel.app`

## Fitur

- 🔐 Login dengan Google (OAuth 2.0)
- 👤 Profil yang bisa diedit (nama, bio, lokasi, website)
- 🔄 Converter format gambar (JPG, PNG, WEBP) & dokumen (TXT, MD, HTML, JSON)
- 🎨 Gambar ke ASCII Art (4 mode karakter, berwarna/hitam-putih)
- ⚙️ Pengaturan tema warna aksen & ukuran font
- 🚪 Logout
