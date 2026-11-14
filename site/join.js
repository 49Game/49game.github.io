// join.html#K7Q2M: only a well-formed code (the app's alphabet and length) is shown or passed on.
(() => {
  let raw = location.hash.slice(1);
  try { raw = decodeURIComponent(raw); } catch (e) {}
  // "friend-fb-abc123" is a friend link (49 for Android): it opens that player's profile in the app.
  const friend = /^friend-([A-Za-z0-9_-]{4,140})$/.exec(raw);
  if (friend && friend[1].includes("-")) {
    document.querySelector("h1").textContent = "Add a friend";
    document.getElementById("open-friend").href = "fortynine://friend/" + friend[1];
    document.getElementById("friend").hidden = false;
    return;
  }
  // "steal-K7Q2M" is a Steal code (a 1 v 1 through Game Center); a plain code is a room.
  const steal = /^steal-/i.test(raw);
  const code = raw.replace(/^steal-/i, "").toUpperCase().replace(/[\s-]/g, "");
  if (/^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{5}$/.test(code)) {
    document.getElementById("code").textContent = code;
    document.getElementById("open").href = (steal ? "fortynine://steal/" : "fortynine://join/") + code;
    if (steal) document.getElementById("kind").textContent = "You're invited to a game of Steal: one board, whoever taps first scores. Your code:";
    document.getElementById("invite").hidden = false;
  } else {
    document.getElementById("no-code").hidden = false;
  }
})();
