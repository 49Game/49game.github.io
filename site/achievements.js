// Filters the list as you type.
const search = document.getElementById("ach-search"), count = document.getElementById("ach-count");
const items = [...document.querySelectorAll(".ach-list li")], groups = [...document.querySelectorAll(".ach-group")];
search.addEventListener("input", () => {
  const q = search.value.trim().toLowerCase();
  let shown = 0;
  items.forEach(li => { const hit = !q || li.dataset.text.includes(q); li.hidden = !hit; shown += hit; });
  groups.forEach(g => { g.hidden = !g.querySelector("li:not([hidden])"); });
  count.textContent = q ? `${shown} of ${items.length} achievements` : "";
});
