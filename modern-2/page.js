// 49 - Focus Booster, modern 2. Small, dependency-free script.

const shuffle = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Classic 7 × 7 rank thresholds in seconds, as in the app.
const ORDER = ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Legend"];
const UNDER = { Bronze: 120, Silver: 90, Gold: 70, Platinum: 55, Diamond: 45, Legend: 35 };
const rankFor = (s) => [...ORDER].reverse().find((r) => r === "Rookie" || s < UNDER[r]);
const fmt = (s) => {
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, "0")}`;
};
const short = (s) => fmt(s).replace(/\.0$/, "");

// The departure board of ranks: one row open at a time.
const board = (() => {
  const rows = [...document.querySelectorAll(".dep__row")];
  const open = (row) => rows.forEach((r) => {
    r.classList.toggle("is-open", r === row);
    r.setAttribute("aria-expanded", String(r === row));
  });
  rows.forEach((r) => r.addEventListener("click", () => open(r)));
  rows.forEach((r) => r.setAttribute("aria-expanded", String(r.classList.contains("is-open"))));
  const showResult = (seconds, rank) => {
    const mine = ORDER.indexOf(rank);
    rows.forEach((r) => {
      const i = ORDER.indexOf(r.dataset.rank);
      const status = r.querySelector(".dep__status");
      const state = i < mine ? "beaten" : i === mine ? "you" : "ahead";
      status.dataset.status = state;
      status.textContent = state === "beaten" ? "Beaten" : state === "you" ? short(seconds) : "Ahead";
    });
    const row = rows[mine];
    const next = ORDER[mine + 1];
    row.querySelector(".dep__detail").textContent = `Your ${fmt(seconds)} lands here.` + (next ? ` ${next} starts under ${short(UNDER[next])}.` : " The top rank.");
    open(row);
  };
  return { showResult };
})();

// The live board in the hero, and the pop-up when it is done.
(() => {
  const grid = document.getElementById("board-grid");
  if (!grid) return;
  const tiles = [...grid.querySelectorAll(".tile")];
  const nextOut = document.getElementById("board-next");
  const label = document.getElementById("board-label");
  const clock = document.getElementById("board-clock");
  const hint = document.getElementById("board-hint");
  const intro = hint.textContent;
  const dialog = document.getElementById("done");
  let next = 1, start = 0, misses = 0, frame = 0, done = false;

  const tick = () => { clock.textContent = fmt((performance.now() - start) / 1000); frame = requestAnimationFrame(tick); };

  const deal = () => {
    shuffle(Array.from({ length: 49 }, (_, i) => i + 1)).forEach((n, i) => {
      const t = tiles[i];
      t.textContent = n; t.className = "tile"; t.disabled = false; t.style.setProperty("--t", i);
    });
    next = 1; misses = 0; done = false; start = 0;
    cancelAnimationFrame(frame);
    label.textContent = "Find"; nextOut.textContent = "1"; clock.textContent = "0:00.0"; hint.textContent = intro;
  };

  const finish = () => {
    cancelAnimationFrame(frame);
    done = true;
    const seconds = (performance.now() - start) / 1000;
    const rank = rankFor(seconds);
    const next = ORDER[ORDER.indexOf(rank) + 1];
    const missText = misses === 0 ? "No misses" : misses === 1 ? "1 miss" : `${misses} misses`;
    clock.textContent = fmt(seconds);
    label.textContent = "Found all"; nextOut.textContent = "49";
    hint.innerHTML = `Done in <b>${fmt(seconds)}</b>. That is <b>${rank}</b>.`;
    board.showResult(seconds, rank);
    if (!dialog || typeof dialog.showModal !== "function") return;
    document.getElementById("done-time").textContent = fmt(seconds);
    document.getElementById("done-title").textContent = `That is ${rank}.`;
    document.getElementById("done-line").textContent = `${missText}. ` + (next ? `${next} starts under ${short(UNDER[next])}.` : "That is the top rank.");
    setTimeout(() => { if (done && !dialog.open) dialog.showModal(); }, 700);
  };

  grid.addEventListener("click", (e) => {
    const t = e.target.closest(".tile");
    if (!t || done || t.classList.contains("is-found")) return;
    if (Number(t.textContent) === next) {
      if (next === 1) { start = performance.now(); frame = requestAnimationFrame(tick); hint.textContent = "Keep going. Eyes on the center."; }
      t.classList.add("is-found"); t.disabled = true;
      next += 1;
      if (next > 49) finish(); else nextOut.textContent = next;
    } else if (start) {
      misses += 1;
      t.classList.add("is-miss");
      setTimeout(() => t.classList.remove("is-miss"), 260);
    }
  });

  if (dialog) {
    const close = () => dialog.close();
    document.getElementById("done-close").addEventListener("click", close);
    document.getElementById("done-android").addEventListener("click", close);
    document.getElementById("done-again").addEventListener("click", () => {
      close(); deal();
      document.getElementById("board").scrollIntoView({ behavior: "smooth", block: "center" });
      tiles[0].focus({ preventScroll: true });
    });
    dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
  }
  deal();
})();

// Features as a command list: type to filter, letters and arrows to choose.
(() => {
  const search = document.getElementById("cmd-search");
  if (!search) return;
  const rows = [...document.querySelectorAll(".cmd__row")];
  const none = document.getElementById("cmd-none");
  const visible = () => rows.filter((r) => !r.hidden);
  const select = (row) => rows.forEach((r) => {
    r.classList.toggle("is-on", r === row);
    r.querySelector(".cmd__name").setAttribute("aria-expanded", String(r === row));
  });
  rows.forEach((r) => r.querySelector(".cmd__name").addEventListener("click", () => select(r)));
  rows.forEach((r) => r.querySelector(".cmd__name").addEventListener("mouseenter", () => { if (matchMedia("(hover: hover)").matches) select(r); }));
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    rows.forEach((r) => { r.hidden = q !== "" && !(r.textContent + " " + r.dataset.words).toLowerCase().includes(q); });
    none.hidden = visible().length > 0;
    if (visible().length && !visible().some((r) => r.classList.contains("is-on"))) select(visible()[0]);
  });
  search.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const list = visible();
    const i = list.findIndex((r) => r.classList.contains("is-on"));
    const n = list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length];
    if (n) select(n);
  });
  // The letter on each row works as a shortcut while the section is on screen and nothing is being typed.
  const section = document.getElementById("features");
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest("input, textarea, select, [contenteditable]")) return;
    const r = section.getBoundingClientRect();
    if (r.top > innerHeight * 0.6 || r.bottom < innerHeight * 0.4) return;
    const row = rows.find((x) => x.dataset.key === e.key.toLowerCase() && !x.hidden);
    if (row) select(row);
  });
  select(rows[0]);
})();

// Entrances: anything above the bottom of the screen is shown, even after a fast jump.
(() => {
  const waiting = new Set(document.querySelectorAll("[data-reveal]"));
  const sweep = () => { for (const el of waiting) if (el.getBoundingClientRect().top < innerHeight * 0.92) { el.classList.add("is-in"); waiting.delete(el); } };
  let queued = false;
  addEventListener("scroll", () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; sweep(); }); }, { passive: true });
  addEventListener("resize", sweep);
  addEventListener("load", () => setTimeout(sweep, 300));
  sweep();
})();

// The phone menu closes after a link is chosen.
document.querySelectorAll(".menu__sheet a").forEach((a) => a.addEventListener("click", () => { a.closest("details").open = false; }));

// Waiting lists: the email goes to our inbox through Web3Forms (the key only says which inbox).
document.querySelectorAll("form.waitlist").forEach((form) => form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const card = form.parentElement;
  const button = form.querySelector("button");
  const error = card.querySelector(".waitlist-error");
  if (form.botcheck.checked) return;
  const label = button.textContent;
  button.disabled = true; button.textContent = "Sending…"; error.hidden = true;
  try {
    const data = new FormData();
    const list = form.dataset.list || "app-store";
    data.append("access_key", form.dataset.key);
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
    error.hidden = false; button.disabled = false; button.textContent = label;
  }
}));
