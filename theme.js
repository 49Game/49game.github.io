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
    if (!themes) themes = await fetch(ROOT + "assets/themes.json").then(r => r.json());
    return themes;
  }

  function clear() {
    const root = document.documentElement;
    root.removeAttribute("style");
    root.removeAttribute("data-theme");
    root.removeAttribute("data-look");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0b0a1a");
    icons(ROOT + "assets/icon-64.png");
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
    icons(`${ROOT}assets/looks/${choice.look}.png`);
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
