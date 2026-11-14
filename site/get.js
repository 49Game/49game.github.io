(function () {
  var IPHONE = 'https://apps.apple.com/app/id6823997426'
  var pages = ['pl', 'de', 'fr', 'es', 'pt-br', 'it', 'ja', 'ko']
  var wanted = (navigator.languages || [navigator.language || 'en']).map(function (l) { return l.toLowerCase() })
  var home = ''
  for (var i = 0; i < wanted.length && !home; i++) {
    var l = wanted[i]
    if (l.indexOf('en') === 0) break
    if (l.indexOf('pt') === 0) { home = 'pt-br/'; break }
    for (var j = 0; j < pages.length; j++) if (l.split('-')[0] === pages[j]) { home = pages[j] + '/'; break }
  }
  var ua = navigator.userAgent
  var android = /Android/i.test(ua)
  var iphone = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  location.replace(iphone ? IPHONE : android ? (home || './') + '#android' : (home || './'))
})()
