// 49 - Focus Booster, new design. Small, dependency-free script.

const shuffle = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Classic rank thresholds in seconds, as in the app (a rank is "under" this time), for both board sizes.
const ORDER = ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Legend"];
const UNDER = {
  5: { Bronze: 44, Silver: 33, Gold: 26, Platinum: 20, Diamond: 16, Legend: 13 },
  7: { Bronze: 120, Silver: 90, Gold: 70, Platinum: 55, Diamond: 45, Legend: 35 },
};
const rankFor = (s, size) => [...ORDER].reverse().find((r) => r === "Rookie" || s < UNDER[size][r]);
const fmt = (s) => {
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(1).padStart(4, "0");
  return `${m}:${rest}`;
};
const short = (s) => fmt(s).replace(/\.0$/, "");
const SIZE_KEY = "49-board-size";
const savedSize = () => { try { return localStorage.getItem(SIZE_KEY) === "7" ? 7 : 5; } catch (e) { return 5; } };

// The live board: find 1 to 25 (or 1 to 49) in order.
(() => {
  const grid = document.getElementById("board-grid");
  if (!grid) return;
  const nextOut = document.getElementById("board-next");
  const clock = document.getElementById("board-clock");
  const hint = document.getElementById("board-hint");
  const again = document.getElementById("board-again");
  const youLine = document.getElementById("ranks-you");
  const rows = [...document.querySelectorAll(".ranks tbody tr")];
  const label = document.getElementById("board-label");
  const sizeButtons = [...document.querySelectorAll(".board__size button")];
  const intro = hint.textContent;
  let size = savedSize(), tiles = [], next = 1, start = 0, misses = 0, frame = 0, done = false;

  const tick = () => {
    clock.textContent = fmt((performance.now() - start) / 1000);
    frame = requestAnimationFrame(tick);
  };

  const deal = () => {
    const count = size * size;
    grid.style.setProperty("--cols", size);
    grid.setAttribute("aria-label", `Schulte table, ${size} by ${size}. Tap the numbers from 1 to ${count} in order.`);
    grid.innerHTML = shuffle(Array.from({ length: count }, (_, i) => i + 1))
      .map((n, i) => `<button class="tile" type="button" style="--t:${i}">${n}</button>`).join("");
    tiles = [...grid.children];
    sizeButtons.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.size === size)));
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
    const rank = rankFor(seconds, size);
    const up = ORDER[ORDER.indexOf(rank) + 1];
    const upText = up ? `${up} starts under ${short(UNDER[size][up])}.` : "That is the top rank.";
    const missText = misses === 0 ? "No misses" : misses === 1 ? "1 miss" : `${misses} misses`;
    hint.innerHTML = `Done in <b>${fmt(seconds)}</b>. That is <b>${rank}</b> on ${size}&nbsp;×&nbsp;${size}. ${upText}`;
    label.textContent = "Found all";
    nextOut.textContent = size * size;
    again.hidden = false;
    rows.forEach((r) => r.classList.toggle("is-you", r.dataset.rank === rank));
    if (youLine) youLine.textContent = `Your ${fmt(seconds)} on the ${size} × ${size} board is ${rank}.`;
    again.focus({ preventScroll: true });
    showDone(seconds, rank, `${missText}. ${upText}`);
  };

  // The pop-up after a finished board: the result, then the way to the app.
  const dialog = document.getElementById("done");
  const showDone = (seconds, rank, line) => {
    if (!dialog || typeof dialog.showModal !== "function") return;
    document.getElementById("done-time").textContent = fmt(seconds);
    document.getElementById("done-title").textContent = `That is ${rank} on ${size} × ${size}.`;
    document.getElementById("done-line").textContent = line;
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
      if (next > size * size) finish();
      else nextOut.textContent = next;
    } else if (start) {
      misses += 1;
      t.classList.add("is-miss");
      setTimeout(() => t.classList.remove("is-miss"), 260);
    }
  });
  sizeButtons.forEach((b) => b.addEventListener("click", () => {
    size = +b.dataset.size;
    try { localStorage.setItem(SIZE_KEY, String(size)); } catch (e) {}
    deal();
  }));
  again.addEventListener("click", () => { deal(); tiles[0].focus({ preventScroll: true }); });
  deal();
})();

// The drawn Red & Black boards: red counts up, black counts down.
document.querySelectorAll("[data-rb]").forEach((root) => {
  const cells = [
    ...Array.from({ length: 25 }, (_, i) => ({ n: i + 1, red: true, done: i < 6 })),
    ...Array.from({ length: 24 }, (_, i) => ({ n: i + 1, red: false, done: i > 18 })),
  ];
  root.innerHTML = shuffle(cells).map((c) => `<span class="${c.red ? "r" : ""}${c.done ? " gone" : ""}">${c.n}</span>`).join("");
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
