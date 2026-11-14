(function () {
  var IPHONE = 'https://apps.apple.com/app/apple-store/id6823997426?pt=129629049&ct=poster&mt=8'
  var ANDROID = 'pl/?from=poster#android'
  var ua = navigator.userAgent
  var platform = /Android/i.test(ua) ? 'android'
    : (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) ? 'ios' : 'other'
  var TARGET = platform === 'android' ? ANDROID : IPHONE
  if (platform === 'android') {
    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('going').textContent = 'Otwieram testy na Androida.'
      var button = document.getElementById('go')
      button.textContent = 'Pokaż, jak dołączyć'
      button.href = ANDROID
    })
  }
  var gone = false
  function go() { if (!gone) { gone = true; location.replace(TARGET) } }
  setTimeout(go, 800)
  try {
    var visit = crypto.randomUUID()
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(visit)).then(function (hash) {
      var user = Array.from(new Uint8Array(hash), function (b) { return b.toString(16).padStart(2, '0') }).join('')
      var signal = { appID: '361CD1BB-D313-4E3A-9185-B3752B50B3E1', clientUser: user, sessionID: visit, type: 'Poster.opened',
                     payload: { platform: platform } }
      if (location.hostname !== '49game.github.io') signal.isTestMode = true
      return fetch('https://nom.telemetrydeck.com/v2/', {
        method: 'POST', mode: 'cors', keepalive: true,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([signal])
      })
    }).then(go, go)
  } catch (e) { go() }
})()
