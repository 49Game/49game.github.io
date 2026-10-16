// 49 website: a playable Schulte table, the same rules as the app's Classic mode.

const board = document.getElementById("board");
const timeLabel = document.getElementById("time");
const nextLabel = document.getElementById("next");
const missesLabel = document.getElementById("misses");
const bestLabel = document.getElementById("best");
const status = document.getElementById("status");
const result = document.getElementById("result");

const settings = { size: 7, dir: "up", variant: "numbers" };
let game;

function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function format(ms) {
  const tenths = Math.floor(ms / 100);
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  return `${m}:${String(s).padStart(2, "0")}.${tenths % 10}`;
}

const bestKey = () => `best-${settings.size}-${settings.dir}-${settings.variant}`;
function readBest() {
  try { const v = Number(localStorage.getItem(bestKey())); return v > 0 ? v : null; } catch (e) { return null; }
}
function saveBest(ms) {
  try { localStorage.setItem(bestKey(), String(ms)); } catch (e) {}
}
function showBest() {
  const best = readBest();
  bestLabel.innerHTML = `Your best here: <b>${best ? format(best) : "none yet"}</b>`;
}

function newGame() {
  const count = settings.size * settings.size;
  const numbers = Array.from({ length: count }, (_, i) => i + 1);
  game = {
    count,
    layout: shuffled(numbers),
    next: settings.dir === "up" ? 1 : count,
    found: 0,
    misses: 0,
    start: null,
    frame: null,
  };
  result.hidden = true;
  board.style.gridTemplateColumns = `repeat(${settings.size}, 1fr)`;
  board.innerHTML = "";
  game.layout.forEach((n, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.textContent = n;
    tile.dataset.n = n;
    tile.dataset.index = index;
    board.appendChild(tile);
  });
  updateHud();
  showBest();
}

function updateHud() {
  timeLabel.textContent = format(game.start ? performance.now() - game.start : 0);
  nextLabel.textContent = game.found === game.count ? "✓" : game.next;
  missesLabel.textContent = game.misses;
}

function tick() {
  updateHud();
  game.frame = requestAnimationFrame(tick);
}

// Shifting boards: after every find, two of the remaining tiles swap places.
function shift() {
  const left = [...board.querySelectorAll(".tile:not(.found)")];
  if (left.length < 3) return;
  const [a, b] = shuffled(left).slice(0, 2);
  [a.textContent, b.textContent] = [b.textContent, a.textContent];
  [a.dataset.n, b.dataset.n] = [b.dataset.n, a.dataset.n];
}

function tap(tile) {
  if (!game || tile.classList.contains("found") || game.found === game.count) return;
  const n = Number(tile.dataset.n);
  if (n !== game.next) {
    if (game.start) game.misses++;
    tile.classList.remove("wrong");
    void tile.offsetWidth;
    tile.classList.add("wrong");
    updateHud();
    return;
  }
  if (!game.start) {
    game.start = performance.now();
    tick();
  }
  tile.classList.add("found");
  tile.setAttribute("aria-disabled", "true");
  game.found++;
  game.next += settings.dir === "up" ? 1 : -1;
  if (game.found === game.count) return finish();
  if (settings.variant === "shifting") shift();
  status.textContent = `Find ${game.next}`;
  updateHud();
}

function finish() {
  cancelAnimationFrame(game.frame);
  const ms = performance.now() - game.start;
  updateHud();
  timeLabel.textContent = format(ms);
  const best = readBest();
  const isBest = !best || ms < best;
  if (isBest) saveBest(ms);
  document.getElementById("result-title").textContent = isBest && best ? "New best!" : "Done!";
  document.getElementById("result-time").textContent = format(ms);
  document.getElementById("result-pace").textContent = `${(ms / 1000 / game.count).toFixed(2)} s`;
  document.getElementById("result-misses").textContent = game.misses;
  document.getElementById("result-misses-label").textContent = game.misses === 1 ? "miss" : "misses";
  document.getElementById("result-note").textContent = best && !isBest
    ? `Your best is ${format(best)}. One more?`
    : "In the app, every game also counts toward your rank.";
  status.textContent = `Done in ${format(ms)} with ${game.misses} ${game.misses === 1 ? "miss" : "misses"}.`;
  showBest();
  result.hidden = false;
  document.getElementById("again").focus({ preventScroll: true });
}

board.addEventListener("pointerdown", event => {
  const tile = event.target.closest(".tile");
  if (tile) { event.preventDefault(); tap(tile); }
});
// Keyboard and VoiceOver activate tiles with a click, which has no pointerdown before it.
board.addEventListener("click", event => {
  const tile = event.target.closest(".tile");
  if (tile && event.detail === 0) tap(tile);
});

document.getElementById("again").addEventListener("click", newGame);

document.querySelectorAll(".chip[data-size], .chip[data-dir], .chip[data-variant]").forEach(chip => {
  chip.addEventListener("click", () => {
    const [key, value] = Object.entries(chip.dataset)[0];
    settings[key] = key === "size" ? Number(value) : value;
    chip.parentElement.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
    newGame();
  });
});

newGame();

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
