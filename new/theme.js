// 49 website: dresses the whole page in a game theme (colors and heading font), remembered across pages.
// The colors come from the app itself (assets/themes.json). With nothing chosen, the site keeps its own design.

const SiteTheme = (() => {
  const KEY = "site-theme";
  // The site root, from this script's own address (pages in language folders load it as ../theme.js).
  const ROOT = document.currentScript ? new URL(".", document.currentScript.src).href : "";
  const FONTS = {
    "RussoOne-Regular": '"Russo One"',
    "BarlowCondensed-ExtraBoldItalic": '"Barlow Condensed"',
    "DMSerifDisplay-Regular": '"DM Serif Display"',
    "DMSerifDisplay-Italic": '"DM Serif Display"',
  };
  let themes = null;

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const write = value => { try { value ? localStorage.setItem(KEY, JSON.stringify(value)) : localStorage.removeItem(KEY); } catch (e) {} };

  async function load() {
    if (!themes) themes = await fetch("/assets/themes.json").then(r => r.json());
    return themes;
  }

  function clear() {
    const root = document.documentElement;
    root.removeAttribute("style");
    root.removeAttribute("data-theme");
    root.removeAttribute("data-look");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0b0a1a");
    icons("/assets/icon-lux-64.png");
    pill(null);
  }

  function fontStack(font) {
    const family = FONTS[font.display];
    if (family) return `${family}, var(--font)`;
    if (font.design === "serif") return 'ui-serif, "New York", Georgia, serif';
    if (font.design === "rounded") return "var(--font)";
    return "var(--font-text)";
  }

  async function apply(choice, remember = true) {
    if (!choice) { clear(); write(null); return; }
    const all = await load();
    const look = all[choice.look];
    const c = look?.palettes?.[choice.palette]?.[choice.appearance];
    if (!c) return;
    const mix = (a, b, p) => `color-mix(in srgb, ${a} ${p}%, ${b})`;
    const vars = {
      "--bg": c.bg, "--bg-2": c.bg2, "--surface": c.surface, "--surface-2": c.surface2, "--line": c.line,
      "--text": c.text, "--text-2": c.text2, "--muted": mix(c.text2, c.bg, 82),
      "--accent": c.accent, "--accent-2": c.fill, "--accent-soft": mix(c.accent, c.surface, 18), "--on-accent": c.onFill,
      "--button": c.fill, "--on-button": c.onFill,
      "--tile": c.tile, "--tile-text": c.tileText, "--tile-found": mix(c.tile, c.bg, 35), "--tile-found-text": mix(c.tileText, c.bg, 30),
      "--font-display": fontStack(look.font),
      "--display-style": look.font.italic ? "italic" : "normal",
    };
    set(choice, vars, c.bg);
    if (remember) write({ ...choice, vars, bg: c.bg });
  }

  function set(choice, vars, bg) {
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.colorScheme = choice.appearance;
    root.dataset.theme = choice.appearance;
    root.dataset.look = choice.look;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
    icons(`/assets/looks/${choice.look}.png`);
    pill(choice);
  }

  // While a theme is on, a small bar at the bottom of every page offers the way back to the site's own design.
  const NAMES = { classic: "Classic", focus: "Focus", arcade: "Neon Arcade", zen: "Zen Ink", pitLane: "Pit Lane", candy: "Candy Pop", blossom: "Blossom" };
  function pill(choice) {
    const show = () => {
      let bar = document.getElementById("theme-pill");
      if (!choice) { bar?.remove(); return; }
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "theme-pill";
        bar.setAttribute("role", "region");
        bar.setAttribute("aria-label", "Theme");
        bar.innerHTML = '<img alt="" width="24" height="24"><span></span><button type="button">Back to the site design</button>';
        bar.querySelector("button").addEventListener("click", () => {
          apply(null);
          document.dispatchEvent(new CustomEvent("sitetheme:reset"));
        });
        document.body.appendChild(bar);
      }
      bar.querySelector("img").src = `/assets/looks/${choice.look}.png`;
      bar.querySelector("span").textContent = `${NAMES[choice.look] || "Theme"} theme`;
    };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", show, { once: true }) : show();
  }

  // The logo in the menu bar and footer becomes the theme's app icon.
  function icons(src) {
    const swap = () => document.querySelectorAll(".brand img, .footer-brand img").forEach(img => { img.src = src; });
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", swap, { once: true }) : swap();
  }

  // Every page puts on the saved theme before it is drawn, from the colors saved with it.
  const saved = read();
  if (saved?.vars) set(saved, saved.vars, saved.bg);

  return { apply, load, saved: () => read() };
})();

// Phones: the page links don't fit beside the logo, so they open from a menu button instead.
(() => {
  const LABELS = { en: "Menu", pl: "Menu", de: "Menü", fr: "Menu", es: "Menú", it: "Menu", "pt-BR": "Menu", ja: "メニュー", ko: "메뉴" };

  function setup() {
    const nav = document.querySelector("header.nav");
    const links = nav && nav.querySelector(".nav-links");
    if (!links || nav.querySelector(".nav-toggle")) return;
    links.id = links.id || "site-menu";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-toggle";
    button.setAttribute("aria-controls", links.id);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", LABELS[document.documentElement.lang] || "Menu");
    for (let i = 0; i < 3; i++) button.appendChild(document.createElement("span"));
    nav.appendChild(button);

    const set = open => {
      nav.classList.toggle("menu-open", open);
      button.setAttribute("aria-expanded", String(open));
    };
    button.addEventListener("click", () => set(!nav.classList.contains("menu-open")));
    links.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
    document.addEventListener("click", e => { if (!nav.contains(e.target)) set(false); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && nav.classList.contains("menu-open")) { set(false); button.focus(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();

// A QR code next to every TestFlight button, to show on your phone so a friend can scan it and join the beta.
(() => {
  const SIZE = 29;
  const PATH = "M0 0h7v1h-7zM9 0h1v1h-1zM13 0h1v1h-1zM17 0h3v1h-3zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM12 1h1v1h-1zM15 1h4v1h-4zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM10 2h1v1h-1zM12 2h1v1h-1zM17 2h2v1h-2zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM9 3h1v1h-1zM11 3h2v1h-2zM14 3h3v1h-3zM18 3h3v1h-3zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM9 4h2v1h-2zM12 4h2v1h-2zM15 4h1v1h-1zM18 4h1v1h-1zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h3v1h-3zM14 5h3v1h-3zM18 5h3v1h-3zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM11 7h1v1h-1zM14 7h1v1h-1zM17 7h2v1h-2zM0 8h1v1h-1zM3 8h1v1h-1zM5 8h2v1h-2zM8 8h1v1h-1zM10 8h1v1h-1zM14 8h1v1h-1zM16 8h1v1h-1zM18 8h1v1h-1zM20 8h2v1h-2zM23 8h1v1h-1zM1 9h3v1h-3zM8 9h9v1h-9zM20 9h3v1h-3zM25 9h1v1h-1zM28 9h1v1h-1zM0 10h1v1h-1zM3 10h2v1h-2zM6 10h3v1h-3zM10 10h1v1h-1zM13 10h1v1h-1zM16 10h2v1h-2zM19 10h1v1h-1zM21 10h1v1h-1zM24 10h4v1h-4zM2 11h1v1h-1zM4 11h1v1h-1zM9 11h1v1h-1zM11 11h3v1h-3zM16 11h1v1h-1zM19 11h5v1h-5zM26 11h2v1h-2zM0 12h2v1h-2zM6 12h2v1h-2zM11 12h3v1h-3zM15 12h3v1h-3zM20 12h4v1h-4zM25 12h1v1h-1zM27 12h2v1h-2zM0 13h1v1h-1zM2 13h1v1h-1zM5 13h1v1h-1zM7 13h1v1h-1zM13 13h2v1h-2zM16 13h2v1h-2zM19 13h3v1h-3zM2 14h5v1h-5zM8 14h3v1h-3zM12 14h1v1h-1zM16 14h1v1h-1zM18 14h1v1h-1zM21 14h1v1h-1zM25 14h4v1h-4zM0 15h2v1h-2zM5 15h1v1h-1zM7 15h2v1h-2zM11 15h4v1h-4zM16 15h3v1h-3zM20 15h2v1h-2zM23 15h1v1h-1zM25 15h1v1h-1zM27 15h1v1h-1zM2 16h1v1h-1zM4 16h1v1h-1zM6 16h2v1h-2zM10 16h3v1h-3zM15 16h1v1h-1zM17 16h1v1h-1zM20 16h2v1h-2zM23 16h1v1h-1zM27 16h1v1h-1zM4 17h1v1h-1zM7 17h1v1h-1zM9 17h4v1h-4zM16 17h2v1h-2zM20 17h4v1h-4zM25 17h1v1h-1zM28 17h1v1h-1zM0 18h1v1h-1zM2 18h2v1h-2zM5 18h3v1h-3zM10 18h2v1h-2zM14 18h1v1h-1zM17 18h1v1h-1zM20 18h1v1h-1zM23 18h2v1h-2zM27 18h2v1h-2zM2 19h2v1h-2zM10 19h1v1h-1zM14 19h5v1h-5zM20 19h1v1h-1zM22 19h1v1h-1zM27 19h2v1h-2zM0 20h1v1h-1zM2 20h1v1h-1zM4 20h3v1h-3zM12 20h1v1h-1zM14 20h3v1h-3zM20 20h5v1h-5zM26 20h1v1h-1zM8 21h1v1h-1zM13 21h1v1h-1zM16 21h1v1h-1zM20 21h1v1h-1zM24 21h1v1h-1zM26 21h3v1h-3zM0 22h7v1h-7zM9 22h1v1h-1zM12 22h1v1h-1zM14 22h1v1h-1zM16 22h1v1h-1zM20 22h1v1h-1zM22 22h1v1h-1zM24 22h1v1h-1zM27 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h1v1h-1zM13 23h2v1h-2zM16 23h1v1h-1zM18 23h1v1h-1zM20 23h1v1h-1zM24 23h5v1h-5zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM12 24h1v1h-1zM14 24h5v1h-5zM20 24h5v1h-5zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM8 25h1v1h-1zM10 25h1v1h-1zM12 25h1v1h-1zM22 25h6v1h-6zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM9 26h1v1h-1zM11 26h3v1h-3zM16 26h1v1h-1zM20 26h1v1h-1zM24 26h3v1h-3zM28 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM9 27h2v1h-2zM14 27h1v1h-1zM17 27h4v1h-4zM23 27h1v1h-1zM27 27h1v1h-1zM0 28h7v1h-7zM8 28h1v1h-1zM11 28h2v1h-2zM14 28h2v1h-2zM17 28h1v1h-1zM20 28h5v1h-5zM27 28h1v1h-1z";
  const TEXT = {
    en: ["Show QR code", "Scan with the iPhone camera to join the beta.", "Close"],
    pl: ["Pokaż kod QR", "Zeskanuj aparatem iPhone'a, aby dołączyć do bety.", "Zamknij"],
    de: ["QR-Code zeigen", "Mit der iPhone-Kamera scannen, um der Beta beizutreten.", "Schließen"],
    fr: ["Afficher le QR code", "Scanne avec l'appareil photo de l'iPhone pour rejoindre la bêta.", "Fermer"],
    es: ["Mostrar código QR", "Escanéalo con la cámara del iPhone para unirte a la beta.", "Cerrar"],
    it: ["Mostra codice QR", "Inquadralo con la fotocamera dell'iPhone per unirti alla beta.", "Chiudi"],
    "pt-BR": ["Mostrar QR code", "Escaneie com a câmera do iPhone para entrar no beta.", "Fechar"],
    ja: ["QRコードを表示", "iPhoneのカメラで読み取ってベータに参加。", "閉じる"],
    ko: ["QR 코드 보기", "iPhone 카메라로 스캔해 베타에 참여하세요.", "닫기"],
  };
  const SVG_NS = "http://www.w3.org/2000/svg";

  function svg(viewBox, width, d, fill) {
    const root = document.createElementNS(SVG_NS, "svg");
    root.setAttribute("viewBox", viewBox);
    root.setAttribute("width", width);
    root.setAttribute("height", width);
    root.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", fill);
    root.appendChild(path);
    return root;
  }

  // Black on white with a quiet zone, whatever the site theme, so every camera reads it.
  function code() {
    const root = svg("-2 -2 " + (SIZE + 4) + " " + (SIZE + 4), 300, PATH, "#000");
    root.setAttribute("shape-rendering", "crispEdges");
    root.setAttribute("role", "img");
    root.removeAttribute("aria-hidden");
    const bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("x", "-2"); bg.setAttribute("y", "-2");
    bg.setAttribute("width", SIZE + 4); bg.setAttribute("height", SIZE + 4);
    bg.setAttribute("fill", "#fff");
    root.prepend(bg);
    return root;
  }

  function style() {
    const css = document.createElement("style");
    css.textContent =
      ".qr-pair{display:inline-flex;align-items:center;gap:10px;max-width:100%}" +
      ".qr-pair>a{min-width:0}" +
      ".qr-button{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;padding:0;flex:none;" +
      "border-radius:14px;border:1px solid var(--line,rgba(127,127,127,.35));background:transparent;color:inherit;cursor:pointer}" +
      ".qr-button:hover{background:var(--surface-2,rgba(127,127,127,.12))}" +
      ".qr-dialog{border:none;border-radius:24px;padding:24px;width:min(360px,calc(100vw - 32px));box-sizing:border-box;text-align:center;" +
      "background:var(--surface,#fff);color:var(--text,#111);box-shadow:0 24px 80px rgba(0,0,0,.35)}" +
      ".qr-dialog::backdrop{background:rgba(0,0,0,.6)}" +
      ".qr-dialog svg{display:block;width:100%;height:auto;margin:0 auto;border-radius:12px}" +
      ".qr-dialog p{margin:16px 0 0;font-size:1rem;line-height:1.4}" +
      ".qr-dialog .qr-close{margin-top:16px;width:100%;justify-content:center}";
    document.head.appendChild(css);
  }

  function setup() {
    const links = [...document.querySelectorAll('a[href*="testflight.apple.com/join"]')];
    if (!links.length || !window.HTMLDialogElement) return;
    const [label, caption, close] = TEXT[document.documentElement.lang] || TEXT.en;
    style();

    const dialog = document.createElement("dialog");
    dialog.className = "qr-dialog";
    dialog.setAttribute("aria-label", label);
    const image = code();
    image.setAttribute("aria-label", label);
    const text = document.createElement("p");
    text.textContent = caption;
    const done = document.createElement("button");
    done.type = "button";
    done.className = "button qr-close";
    done.textContent = close;
    done.addEventListener("click", () => dialog.close());
    dialog.append(image, text, done);
    dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
    document.body.appendChild(dialog);

    for (const link of links) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "qr-button";
      button.title = label;
      button.setAttribute("aria-label", label);
      button.appendChild(svg("0 0 24 24", 22, "M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm8-2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm2 2h2v2h-2zm-6 2h2v2h-2zm4 0h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2z", "currentColor"));
      button.addEventListener("click", () => dialog.showModal());
      // Keep the button beside its link, also where the link sits alone in a centred column.
      const pair = document.createElement("span");
      pair.className = "qr-pair";
      link.replaceWith(pair);
      pair.append(link, button);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
