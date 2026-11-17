document.documentElement.classList.add('js')
// Below the top, the page skips laying out what is far from the screen (style.css, content-visibility). A visit that
// starts at a section (a link with #), a reload or Back/Forward (the browser puts you back where you were) lays out
// everything at once instead, so it lands in the right place.
try {
  var nav = performance.getEntriesByType('navigation')[0]
  if (location.hash || (nav && nav.type !== 'navigate')) document.documentElement.classList.add('laid-out')
} catch (e) { document.documentElement.classList.add('laid-out') }
