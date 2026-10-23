// 49 - Focus Booster, new design. Small, dependency-free script.

const shuffle = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// The page's own wording (each language page carries its translation), with English as the fallback.
const T = (() => { try { return JSON.parse(document.getElementById("strings").textContent); } catch (e) { return {}; } })();
const say = (key, values = {}) => (T[key] || key).replace(/\{(\w+)\}/g, (_, k) => values[k]);

// Language: remember a pick from the menus; on a first visit to the English home page, follow the browser's language.
(() => {
  const homes = { pl: "pl/", de: "de/", fr: "fr/", es: "es/", pt: "pt-br/", it: "it/", ja: "ja/", ko: "ko/" };
  document.querySelectorAll("a[data-lang]").forEach((a) => a.addEventListener("click", () => {
    try { localStorage.setItem("lang", a.dataset.lang); } catch (e) {}
  }));
  // The menus (sections on a phone, language) close on a click anywhere else, or Escape.
  const menus = [...document.querySelectorAll("details.nav__menu, details.lang")];
  document.addEventListener("click", (e) => menus.forEach((m) => { if (m.open && !m.contains(e.target)) m.open = false; }));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    menus.forEach((m) => { if (m.open) { m.open = false; m.querySelector("summary").focus(); } });
  });
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  if (saved || document.documentElement.lang !== "en" || /bot|crawl|spider/i.test(navigator.userAgent)) return;
  const wanted = (navigator.languages || [navigator.language || "en"]).map((l) => l.toLowerCase().split("-")[0]);
  const first = wanted.find((l) => l === "en" || homes[l]);
  if (first && first !== "en") location.replace(homes[first] + location.hash);
})();

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(1).padStart(4, "0");
  return `${m}:${rest}`;
};

// The live board: a 4 x 4 taster, find 1 to 16 in order. The full boards are in the app.
(() => {
  const grid = document.getElementById("board-grid");
  if (!grid) return;
  const nextOut = document.getElementById("board-next");
  const clock = document.getElementById("board-clock");
  const hint = document.getElementById("board-hint");
  const again = document.getElementById("board-again");
  const label = document.getElementById("board-label");
  const intro = hint.textContent;
  const size = 4;
  let tiles = [], next = 1, start = 0, misses = 0, frame = 0, done = false;

  const tick = () => {
    clock.textContent = fmt((performance.now() - start) / 1000);
    frame = requestAnimationFrame(tick);
  };

  const deal = () => {
    const count = size * size;
    grid.style.setProperty("--cols", size);
    grid.setAttribute("aria-label", say("boardLabel"));
    grid.innerHTML = shuffle(Array.from({ length: count }, (_, i) => i + 1))
      .map((n, i) => `<button class="tile" type="button" style="--t:${i}">${n}</button>`).join("");
    tiles = [...grid.children];
    next = 1; misses = 0; done = false; start = 0;
    cancelAnimationFrame(frame);
    label.textContent = say("find");
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
    const missText = misses === 0 ? say("missNone") : misses === 1 ? say("missOne") : say("missMany", { n: misses });
    hint.innerHTML = say("doneHint", { time: fmt(seconds) });
    label.textContent = say("foundAll");
    nextOut.textContent = size * size;
    again.hidden = false;
    again.focus({ preventScroll: true });
    showDone(seconds, say("doneLine", { time: fmt(seconds), misses: missText }));
  };

  // The pop-up after a finished board: the result, then the way to the app.
  const dialog = document.getElementById("done");
  const showDone = (seconds, line) => {
    if (!dialog || typeof dialog.showModal !== "function") return;
    document.getElementById("done-time").textContent = fmt(seconds);
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
      if (next === 1) { start = performance.now(); frame = requestAnimationFrame(tick); hint.textContent = say("going"); }
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

// Each chapter's stage follows its own reading column on wide screens.
document.querySelectorAll(".chapter").forEach((chapter) => {
  const layers = [...chapter.querySelectorAll(".stage__layer")];
  const sections = [...chapter.querySelectorAll(".read [data-stage]")];
  if (!layers.length || !("IntersectionObserver" in window)) return;
  const show = (name) => layers.forEach((l) => l.classList.toggle("is-on", l.dataset.layer === name));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) show(e.target.dataset.stage);
  }, { rootMargin: "-45% 0px -45% 0px" });
  sections.forEach((s) => io.observe(s));
});

// The header shows every link when they fit beside the board, else its menu button.
(() => {
  const nav = document.querySelector("header.nav");
  if (!nav || !nav.querySelector(".nav__links")) return;
  const fit = () => {
    nav.classList.remove("is-compact");
    if (innerWidth <= 900) return;
    const right = Math.max(...[...nav.children].map((c) => c.getBoundingClientRect().right));
    nav.classList.toggle("is-compact", nav.scrollWidth > nav.clientWidth + 1 || right > innerWidth + 1);
  };
  fit();
  addEventListener("resize", fit);
  document.fonts?.ready.then(fit);
})();

// The way in stays in reach: once the hero's own buttons scroll away, a bar slides down at the top with
// the section you are in (a one-word name from the page's strings, tap it for every section), the
// language menu and "Join the beta" (with the QR code on computers), all in the page's language.
(() => {
  const heroActions = document.querySelector(".hero__actions");
  const join = heroActions?.querySelector('a.button[href*="testflight"]');
  if (!heroActions || !join || !("IntersectionObserver" in window)) return;
  const sections = [...document.querySelectorAll("main section[id]")].filter((s) => T["s_" + s.id]);
  const bar = document.createElement("div");
  bar.className = "topbar";

  const home = document.createElement("a");
  home.className = "topbar__home";
  home.href = "#top";
  home.textContent = "49";

  // The section button is the menu: it names where you are and opens the list of every section.
  const menu = document.createElement("details");
  menu.className = "topbar__menu";
  const summary = document.createElement("summary");
  summary.innerHTML = '<span class="topbar__dot"></span><span class="topbar__name"></span><span class="topbar__caret"></span>';
  const name = summary.querySelector(".topbar__name");
  name.textContent = document.querySelector(".nav__menu summary")?.textContent.trim() || "";
  const list = document.createElement("nav");
  list.className = "topbar__list";
  list.setAttribute("aria-label", document.querySelector(".nav__sheet")?.getAttribute("aria-label") || "");
  const items = sections.map((s) => {
    const a = document.createElement("a");
    a.href = "#" + s.id;
    a.textContent = T["s_" + s.id];
    list.append(a);
    return a;
  });
  menu.append(summary, list);

  const actions = document.createElement("div");
  actions.className = "topbar__actions";
  actions.append(menu);
  const lang = document.querySelector(".nav details.lang");
  if (lang) actions.append(lang.cloneNode(true));
  const qr = heroActions.querySelector(".hero__qr");
  if (qr) {
    // The copy keeps aria-controls="qr", so the QR script below opens the window from it too.
    actions.append(qr.cloneNode(true));
  }
  actions.append(join.cloneNode(true));
  bar.append(home, actions);
  document.body.append(bar);

  // The section list unrolls from the button and rolls back up when it closes.
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const shut = () => {
    if (!menu.open) return;
    if (still.matches || !list.animate) { menu.open = false; return; }
    list.animate([{ clipPath: "inset(0 0 0 0)", opacity: 1 }, { clipPath: "inset(0 0 100% 0)", opacity: 0 }],
      { duration: 220, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }).onfinish = () => { menu.open = false; };
  };
  summary.addEventListener("click", (e) => { if (menu.open) { e.preventDefault(); shut(); } });
  items.forEach((a) => a.addEventListener("click", shut));
  // Both menus in the bar close on a click elsewhere or Escape, like the ones in the header.
  const menus = [...bar.querySelectorAll("details")];
  document.addEventListener("click", (e) => menus.forEach((m) => { if (m.open && !m.contains(e.target)) (m === menu ? shut() : (m.open = false)); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") menus.forEach((m) => (m === menu ? shut() : (m.open = false))); });
  bar.querySelectorAll("a[data-lang]").forEach((a) => a.addEventListener("click", () => {
    try { localStorage.setItem("lang", a.dataset.lang); } catch (e) {}
  }));

  const show = (on) => {
    bar.classList.toggle("is-on", on);
    bar.toggleAttribute("inert", !on);
    if (!on) menus.forEach((m) => { m.open = false; });
  };
  show(false);
  new IntersectionObserver(([e]) => show(!e.isIntersecting && e.boundingClientRect.top < 0)).observe(heroActions);

  // The name follows the section crossing the middle of the screen.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = sections.indexOf(e.target);
      name.textContent = T["s_" + e.target.id];
      items.forEach((a, k) => a.toggleAttribute("aria-current", k === i));
    }
  }, { rootMargin: "-50% 0px -50% 0px" });
  sections.forEach((s) => io.observe(s));
})();

// Screen recordings play only while on screen, and never for people who asked for less motion.
(() => {
  const videos = [...document.querySelectorAll("video[autoplay]")];
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const stop = () => videos.forEach((v) => { v.pause(); v.removeAttribute("autoplay"); });
  if (still.matches) return stop();
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause();
  });
  videos.forEach((v) => io.observe(v));
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

// The QR code for the beta: opened from the hero, closed by its button, Escape or a click outside.
(() => {
  const dialog = document.getElementById("qr");
  if (!dialog || typeof dialog.showModal !== "function") return;
  // Focus goes to the window itself, so its Close button doesn't light up the moment it opens.
  dialog.tabIndex = -1;
  const open = () => { dialog.showModal(); dialog.focus(); };
  document.querySelectorAll('[aria-controls="qr"]').forEach((b) => b.addEventListener("click", open));
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
})();

// The Android waiting list opens in a window wherever it's offered, instead of sending you to the foot of the page.
(() => {
  const dialog = document.getElementById("android-pop");
  if (!dialog || typeof dialog.showModal !== "function") return;
  dialog.tabIndex = -1;
  const open = () => {
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
    dialog.showModal();
    dialog.focus();
  };
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href="#android"]');
    if (!link || dialog.contains(link)) return;
    e.preventDefault();
    open();
  });
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
})();

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
