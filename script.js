// 49 website: the looks gallery.

// --- Looks gallery: pick a look and light or dark ---------------------------
const looks = JSON.parse(document.getElementById("looks-data").textContent);
const lookImage = document.getElementById("look-img");
const look = { id: "classic", appearance: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" };

function showLook() {
  const info = looks[look.id];
  lookImage.src = `assets/screens/${look.id}-${look.appearance}.png`;
  lookImage.alt = `The ${info.name} look, ${look.appearance}`;
  document.getElementById("look-name").textContent = info.name;
  document.getElementById("look-tagline").textContent = info.tagline;
  document.getElementById("look-extra").textContent = info.extra;
  document.querySelectorAll("[data-look]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.look === look.id)));
  document.querySelectorAll("[data-appearance]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.appearance === look.appearance)));
}

document.querySelectorAll("[data-look]").forEach(b => b.addEventListener("click", () => { look.id = b.dataset.look; showLook(); }));
document.querySelectorAll("[data-appearance]").forEach(b => b.addEventListener("click", () => { look.appearance = b.dataset.appearance; showLook(); }));
showLook();
// Load every screen ahead of time so switching is instant.
Object.keys(looks).forEach(id => ["light", "dark"].forEach(a => { new Image().src = `assets/screens/${id}-${a}.png`; }));
