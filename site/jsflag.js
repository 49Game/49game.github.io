document.documentElement.classList.add('js')
// The device, before the first paint, so the page draws its own buttons straight away (Android: the test's steps,
// iPhone: the App Store, a computer: both and the QR code). Drawing one set and swapping in another a moment later
// counted as loading in PageSpeed's Speed Index. page.js does the rest (the Android links).
;(function () {
  var ua = navigator.userAgent, root = document.documentElement
  if (/Android/i.test(ua)) root.classList.add('on-android')
  else if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) root.classList.add('on-ios')
  else root.classList.add('on-desktop')
})()
// Below the top, the page skips laying out what is far from the screen (style.css, content-visibility). A visit that
// starts at a section (a link with #), a reload or Back/Forward (the browser puts you back where you were) lays out
// everything at once instead, so it lands in the right place.
try {
  var nav = performance.getEntriesByType('navigation')[0]
  if (location.hash || (nav && nav.type !== 'navigate')) document.documentElement.classList.add('laid-out')
} catch (e) { document.documentElement.classList.add('laid-out') }
