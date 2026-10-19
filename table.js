// 49 website: the free online Schulte table, with the same rules as the app's Classic mode.
// Every word comes from the page (#table-strings), so each language page stays in its language.

(() => {
  const text = JSON.parse(document.getElementById("table-strings").textContent);
  const lang = document.documentElement.lang;
  const plural = new Intl.PluralRules(lang);
  const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key]);
  const missWord = count => text.misses[plural.select(count)] || text.misses.other;

  // The language menu closes on a click anywhere else, or Escape.
  const menu = document.querySelector("details.lang");
  if (menu) {
    document.addEventListener("click", e => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); } });
    menu.querySelectorAll(".lang-menu a").forEach(a => a.addEventListener("click", () => {
      try { localStorage.setItem("lang", a.dataset.lang); } catch (e) {}
    }));
  }

  const board = document.getElementById("board");
  const timeLabel = document.getElementById("time");
  const nextLabel = document.getElementById("next");
  const missesLabel = document.getElementById("misses");
  const bestLabel = document.getElementById("best");
  const status = document.getElementById("status");
  const result = document.getElementById("result");

  const settings = { size: 5, dir: "up" };
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

  // Best times stay in this browser only (the same keys in every language).
  const bestKey = () => `table-best-${settings.size}-${settings.dir}`;
  function readBest() {
    try { const v = Number(localStorage.getItem(bestKey())); return v > 0 ? v : null; } catch (e) { return null; }
  }
  function saveBest(ms) {
    try { localStorage.setItem(bestKey(), String(ms)); } catch (e) {}
  }
  function showBest() {
    const best = readBest();
    bestLabel.innerHTML = "";
    const value = document.createElement("b");
    value.textContent = best ? format(best) : text.bestNone;
    bestLabel.append(text.best + " ", value);
  }

  function newGame() {
    if (game) cancelAnimationFrame(game.frame);
    const count = settings.size * settings.size;
    const numbers = Array.from({ length: count }, (_, i) => i + 1);
    game = { count, next: settings.dir === "up" ? 1 : count, found: 0, misses: 0, start: null, frame: null };
    result.hidden = true;
    board.style.gridTemplateColumns = `repeat(${settings.size}, 1fr)`;
    board.dataset.size = settings.size;
    board.innerHTML = "";
    shuffled(numbers).forEach(n => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.textContent = n;
      tile.dataset.n = n;
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

  function tap(tile) {
    if (!game || tile.classList.contains("found") || game.found === game.count) return;
    if (Number(tile.dataset.n) !== game.next) {
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
    status.textContent = fill(text.find, { n: game.next });
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
    document.getElementById("result-title").textContent = isBest && best ? text.newBest : text.done;
    document.getElementById("result-time").textContent = format(ms);
    document.getElementById("result-pace").textContent = `${(ms / 1000 / game.count).toFixed(2)} s`;
    document.getElementById("result-misses").textContent = game.misses;
    document.getElementById("result-misses-label").textContent = missWord(game.misses);
    document.getElementById("result-best").textContent = best && !isBest ? fill(text.yourBest, { t: format(best) }) : "";
    status.textContent = fill(text.finished, { t: format(ms), m: `${game.misses} ${missWord(game.misses)}` });
    showBest();
    result.hidden = false;
    document.querySelector(".result-actions > :first-child").focus({ preventScroll: true });
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

  document.querySelectorAll(".chip[data-size], .chip[data-dir]").forEach(chip => {
    chip.addEventListener("click", () => {
      const [key, value] = Object.entries(chip.dataset)[0];
      settings[key] = key === "size" ? Number(value) : value;
      chip.parentElement.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c === chip)));
      newGame();
    });
  });

  newGame();
})();
