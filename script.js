// The site root, from this script's own address (language pages load it as ../script.js).
const ROOT = document.currentScript ? new URL(".", document.currentScript.src).href : "";
// 49 website: the theme preview. Pick a look, a palette and light or dark; the screen follows.

// Language: remember a pick from the menu; on a first visit to the English home page, follow the browser's language.
(() => {
  const supported = { pl: "pl/", de: "de/", fr: "fr/", es: "es/", pt: "pt-br/", it: "it/", ja: "ja/", ko: "ko/" };
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  document.querySelectorAll(".lang-menu a").forEach(a => a.addEventListener("click", () => {
    try { localStorage.setItem("lang", a.dataset.lang); } catch (e) {}
  }));
  if (saved || document.documentElement.lang !== "en" || /bot|crawl|spider/i.test(navigator.userAgent)) return;
  const wanted = (navigator.languages || [navigator.language || "en"]).map(l => l.toLowerCase().split("-")[0]);
  const first = wanted.find(l => l === "en" || supported[l]);
  if (first && first !== "en") location.replace(ROOT + supported[first] + location.hash);
})();

const looks = JSON.parse(document.getElementById("looks-data").textContent);
const lookImage = document.getElementById("look-img");
const swatches = document.getElementById("swatches");
const saved = SiteTheme.saved();
const state = saved
  ? { look: saved.look, palette: saved.palette, appearance: saved.appearance }
  : { look: "classic", palette: null, appearance: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" };
// The page only takes on a theme once the visitor picks something.
let themed = Boolean(saved);

const screenURL = (look, palette, appearance) => `${ROOT}assets/screens/p/${look}-${palette}-${appearance}.webp`;

function showLook() {
  const info = looks[state.look];
  const palette = info.palettes.find(p => p.id === state.palette) || info.palettes[0];
  state.palette = palette.id;
  lookImage.src = screenURL(state.look, palette.id, state.appearance);
  // The page can give its own wording (data-alt with {look}, {palette}, {appearance}), so translated pages stay translated.
  const appearanceName = document.querySelector(`[data-appearance="${state.appearance}"]`)?.textContent || state.appearance;
  lookImage.alt = (lookImage.dataset.alt || "The {look} theme in {palette}, {appearance}")
    .replace("{look}", info.name).replace("{palette}", palette.name).replace("{appearance}", appearanceName.toLowerCase());
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
    button.addEventListener("click", () => choose(() => { state.palette = p.id; }));
    swatches.appendChild(button);
  });
  document.querySelectorAll("[data-look]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.look === state.look)));
  document.querySelectorAll("[data-appearance]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.appearance === state.appearance)));
  document.getElementById("theme-reset").hidden = !themed;
  if (themed) SiteTheme.apply({ look: state.look, palette: state.palette, appearance: state.appearance });
  preload();
}

function choose(change) {
  change();
  themed = true;
  showLook();
}

// Loads the other screens of the current look ahead of time, so switching is instant.
function preload() {
  looks[state.look].palettes.forEach(p => ["light", "dark"].forEach(a => { new Image().src = screenURL(state.look, p.id, a); }));
}

document.querySelectorAll("[data-look]").forEach(b => b.addEventListener("click", () => choose(() => { state.look = b.dataset.look; state.palette = null; })));
document.querySelectorAll("[data-appearance]").forEach(b => b.addEventListener("click", () => choose(() => { state.appearance = b.dataset.appearance; })));
document.getElementById("theme-reset").addEventListener("click", () => {
  themed = false;
  SiteTheme.apply(null);
  showLook();
});
showLook();
