// 49 website: the theme preview. Pick a look, a palette and light or dark; the screen follows.

const looks = JSON.parse(document.getElementById("looks-data").textContent);
const lookImage = document.getElementById("look-img");
const swatches = document.getElementById("swatches");
const state = { look: "classic", palette: null, appearance: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" };

const screenURL = (look, palette, appearance) => `assets/screens/p/${look}-${palette}-${appearance}.webp`;

function showLook() {
  const info = looks[state.look];
  const palette = info.palettes.find(p => p.id === state.palette) || info.palettes[0];
  state.palette = palette.id;
  lookImage.src = screenURL(state.look, palette.id, state.appearance);
  lookImage.alt = `The ${info.name} theme in ${palette.name}, ${state.appearance}`;
  document.getElementById("look-name").textContent = info.name;
  document.getElementById("look-tagline").textContent = info.tagline;
  swatches.innerHTML = "";
  info.palettes.forEach(p => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch";
    button.setAttribute("aria-pressed", String(p.id === palette.id));
    const dot = document.createElement("i");
    dot.style.background = p.swatch2 ? `linear-gradient(135deg, ${p.swatch} 50%, ${p.swatch2} 50%)` : p.swatch;
    button.append(dot, p.name);
    button.addEventListener("click", () => { state.palette = p.id; showLook(); });
    swatches.appendChild(button);
  });
  document.querySelectorAll("[data-look]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.look === state.look)));
  document.querySelectorAll("[data-appearance]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.appearance === state.appearance)));
  preload();
}

// Loads the other screens of the current look ahead of time, so switching is instant.
function preload() {
  looks[state.look].palettes.forEach(p => ["light", "dark"].forEach(a => { new Image().src = screenURL(state.look, p.id, a); }));
}

document.querySelectorAll("[data-look]").forEach(b => b.addEventListener("click", () => { state.look = b.dataset.look; state.palette = null; showLook(); }));
document.querySelectorAll("[data-appearance]").forEach(b => b.addEventListener("click", () => { state.appearance = b.dataset.appearance; showLook(); }));
showLook();
