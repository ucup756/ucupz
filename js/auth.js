// ============================================================
// auth.js — Google login, session, logout
// ============================================================

// ⚠️  Ganti dengan Client ID dari Google Cloud Console
const GOOGLE_CLIENT_ID = "438060631154-skhv5ldhr9o738bmu0goa6nslj5pmq06.apps.googleusercontent.com";

function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("loginAt", new Date().toISOString());
}

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function clearUser() {
  localStorage.removeItem("user");
  localStorage.removeItem("loginAt");
  localStorage.removeItem("profile");
}

// Callback dari Google GSI
function handleLogin(response) {
  const base64  = response.credential.split(".")[1];
  const json    = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  const payload = JSON.parse(json);

  const user = {
    name:    payload.name,
    email:   payload.email,
    picture: payload.picture,
    sub:     payload.sub,
  };

  saveUser(user);
  window.location.href = "pages/profil.html";
}

// Proteksi halaman — panggil di setiap halaman app
function requireLogin() {
  const user = getUser();
  if (!user) {
    window.location.href = "../index.html";
    return null;
  }
  fillSidebarUser(user);
  return user;
}

function fillSidebarUser(user) {
  const avatarEl = document.getElementById("user-avatar");
  const nameEl   = document.getElementById("user-name");
  const emailEl  = document.getElementById("user-email");
  if (avatarEl) avatarEl.src = user.picture || "";
  if (nameEl)   nameEl.textContent = user.name || "—";
  if (emailEl)  emailEl.textContent = user.email || "—";
}

function logout() {
  if (!confirm("Yakin ingin keluar?")) return;
  clearUser();
  window.location.href = "../index.html";
}
