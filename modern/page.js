// 49 - Focus Booster, new design. Small, dependency-free script.

const shuffle = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Classic 7 × 7 rank thresholds in seconds, the same as in the app (rank: "under" this time).
const RANKS = [
  { name: "Legend", under: 35 },
  { name: "Diamond", under: 45 },
  { name: "Platinum", under: 55 },
  { name: "Gold", under: 70 },
  { name: "Silver", under: 90 },
  { name: "Bronze", under: 120 },
];
const rankFor = (seconds) => RANKS.find((r) => seconds < r.under)?.name || "Rookie";
const nextRank = (name) => {
  const order = ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Legend"];
  const next = order[order.indexOf(name) + 1];
  return next ? RANKS.find((r) => r.name === next) : null;
};
const fmt = (s) => {
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(1).padStart(4, "0");
  return `${m}:${rest}`;
};

// The live board: find 1 to 49 in order.
(() => {
  const grid = document.getElementById("board-grid");
  if (!grid) return;
  const tiles = [...grid.querySelectorAll(".tile")];
  const nextOut = document.getElementById("board-next");
  const clock = document.getElementById("board-clock");
  const hint = document.getElementById("board-hint");
  const again = document.getElementById("board-again");
  const youLine = document.getElementById("ranks-you");
  const rows = [...document.querySelectorAll(".ranks tbody tr")];
  const label = document.getElementById("board-label");
  const intro = hint.textContent;
  let next = 1, start = 0, misses = 0, frame = 0, done = false;

  const tick = () => {
    clock.textContent = fmt((performance.now() - start) / 1000);
    frame = requestAnimationFrame(tick);
  };

  const deal = () => {
    shuffle(Array.from({ length: 49 }, (_, i) => i + 1)).forEach((n, i) => {
      const t = tiles[i];
      t.textContent = n;
      t.className = "tile";
      t.disabled = false;
      t.style.setProperty("--t", i);
    });
    next = 1; misses = 0; done = false; start = 0;
    cancelAnimationFrame(frame);
    label.textContent = "Find";
    nextOut.textContent = "1";
    clock.textContent = "0:00.0";
    hint.textContent = intro;
    again.hidden = true;
  };

  const finish = () => {
    cancelAnimationFrame(frame);
    done = true;
    const seconds = (performance.now() - start) / 1000;
    clock.textContent = fmt(seconds);
    const rank = rankFor(seconds);
    const up = nextRank(rank);
    const missText = misses === 0 ? "no misses" : misses === 1 ? "1 miss" : `${misses} misses`;
    hint.innerHTML = `Done in <b>${fmt(seconds)}</b> with ${missText}. That is <b>${rank}</b>.` +
      (up ? ` ${up.name} starts under ${fmt(up.under).replace(/\.0$/, "")}.` : " The top rank.");
    label.textContent = "Found all";
    nextOut.textContent = "49";
    again.hidden = false;
    rows.forEach((r) => r.classList.toggle("is-you", r.dataset.rank === rank));
    if (youLine) youLine.textContent = `Your ${fmt(seconds)} on this board is ${rank} in Classic.`;
    again.focus({ preventScroll: true });
    showDone(seconds, rank, up, missText);
  };

  // The pop-up after a finished board: the result, then the way to the app.
  const dialog = document.getElementById("done");
  const showDone = (seconds, rank, up, missText) => {
    if (!dialog || typeof dialog.showModal !== "function") return;
    document.getElementById("done-time").textContent = fmt(seconds);
    document.getElementById("done-title").textContent = `That is ${rank}.`;
    document.getElementById("done-line").textContent = up
      ? `${missText[0].toUpperCase() + missText.slice(1)}. ${up.name} starts under ${fmt(up.under).replace(/\.0$/, "")}.`
      : `${missText[0].toUpperCase() + missText.slice(1)}. That is the top rank.`;
    setTimeout(() => { if (done && !dialog.open) dialog.showModal(); }, 700);
  };
  if (dialog) {
    const close = () => dialog.close();
    document.getElementById("done-close").addEventListener("click", close);
    document.getElementById("done-android").addEventListener("click", close);
    document.getElementById("done-again").addEventListener("click", () => { close(); deal(); tiles[0].focus({ preventScroll: true }); });
    dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
  }

  grid.addEventListener("click", (e) => {
    const t = e.target.closest(".tile");
    if (!t || done || t.classList.contains("is-found")) return;
    const n = Number(t.textContent);
    if (n === next) {
      if (next === 1) { start = performance.now(); frame = requestAnimationFrame(tick); hint.textContent = "Keep going. A miss costs you nothing here, but it does in the app."; }
      t.classList.add("is-found");
      t.disabled = true;
      next += 1;
      if (next > 49) finish();
      else nextOut.textContent = next;
    } else if (start) {
      misses += 1;
      t.classList.add("is-miss");
      setTimeout(() => t.classList.remove("is-miss"), 260);
    }
  });
  again.addEventListener("click", () => { deal(); tiles[0].focus({ preventScroll: true }); });
  deal();
})();

// The drawn Red & Black boards: red counts up, black counts down.
document.querySelectorAll("[data-rb]").forEach((root) => {
  const cells = [
    ...Array.from({ length: 25 }, (_, i) => ({ n: i + 1, red: true, done: i < 6 })),
    ...Array.from({ length: 24 }, (_, i) => ({ n: i + 1, red: false, done: i > 18 })),
  ];
  root.innerHTML = shuffle(cells).map((c) => `<span class="${c.red ? "r" : ""}${c.done ? " done" : ""}">${c.n}</span>`).join("");
});

// The stage follows the reading column on wide screens.
(() => {
  const layers = [...document.querySelectorAll(".stage__layer")];
  const sections = [...document.querySelectorAll(".read [data-stage]")];
  if (!layers.length || !("IntersectionObserver" in window)) return;
  const show = (name) => layers.forEach((l) => l.classList.toggle("is-on", l.dataset.layer === name));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) show(e.target.dataset.stage);
  }, { rootMargin: "-45% 0px -45% 0px" });
  sections.forEach((s) => io.observe(s));
})();

// Reveal once as a section enters. Never leaves content hidden: anything already above the
// bottom of the screen is shown, also after a fast jump or a scroll the observer did not see.
(() => {
  const waiting = new Set(document.querySelectorAll("[data-reveal]"));
  const sweep = () => {
    for (const el of waiting) {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) { el.classList.add("is-in"); waiting.delete(el); }
    }
  };
  let queued = false;
  addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; sweep(); });
  }, { passive: true });
  addEventListener("resize", sweep);
  addEventListener("load", () => setTimeout(sweep, 300));
  sweep();
})();

// A minute a day: one slider drives the clause and the screen.
(() => {
  const range = document.getElementById("day-range");
  if (!range) return;
  const root = range.closest(".day");
  const track = range.parentElement;
  const clauses = [...root.querySelectorAll(".day__clause")];
  const frags = [...root.querySelectorAll(".frag")];
  const stops = [...root.querySelectorAll(".day__stops li")];
  const set = (i) => {
    range.value = i;
    track.style.setProperty("--v", i);
    clauses.forEach((el) => el.classList.toggle("is-on", +el.dataset.step === i));
    frags.forEach((el) => el.classList.toggle("is-on", +el.dataset.step === i));
    stops.forEach((el, k) => el.classList.toggle("is-on", k === i));
    clauses.forEach((el) => el.querySelector("button").setAttribute("aria-pressed", String(+el.dataset.step === i)));
    range.setAttribute("aria-valuetext", `${stops[i].textContent}: ${clauses[i].textContent}`);
  };
  clauses.forEach((el) => el.querySelector("button").addEventListener("click", () => set(+el.dataset.step)));
  range.addEventListener("input", () => set(Number(range.value)));
  stops.forEach((el, k) => el.addEventListener("click", () => set(k)));
  set(0);
})();

// Seven looks: tap to switch a look between light and dark.
document.querySelectorAll(".looks__shot").forEach((b) => b.addEventListener("click", () => {
  b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
}));

// The phone menu closes after a link is chosen.
document.querySelectorAll(".nav__sheet a").forEach((a) => a.addEventListener("click", () => a.closest("details").open = false));

// Waiting lists: the email goes to our inbox through Web3Forms (the key only says which inbox).
document.querySelectorAll("form.waitlist").forEach((form) => form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const card = form.parentElement;
  const button = form.querySelector("button");
  const error = card.querySelector(".waitlist-error");
  if (form.botcheck.checked) return;
  button.disabled = true;
  error.hidden = true;
  try {
    const data = new FormData();
    data.append("access_key", form.dataset.key);
    const list = form.dataset.list || "app-store";
    data.append("subject", (list === "android" ? "49 Android waiting list: " : "49 waiting list: ") + document.documentElement.lang);
    data.append("list", list);
    data.append("from_name", "49 website");
    data.append("email", form.email.value.trim());
    data.append("language", document.documentElement.lang);
    data.append("page", location.pathname);
    const response = await fetch("https://api.web3forms.com/submit", { method: "POST", body: data, headers: { Accept: "application/json" } });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "failed");
    form.hidden = true;
    card.querySelector(".waitlist-done").hidden = false;
  } catch (e) {
    error.hidden = false;
    button.disabled = false;
  }
}));
