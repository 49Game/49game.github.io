// The phone menu closes after a link is chosen, on a click anywhere else, or Escape.
(() => {
  const menu = document.querySelector("details.nav__menu");
  if (!menu) return;
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { menu.open = false; }));
  document.addEventListener("click", (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); } });
})();
