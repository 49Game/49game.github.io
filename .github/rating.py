#!/usr/bin/env python3
"""The App Store rating under the name on the nine home pages.

App Store ratings are kept per country, so each language page shows its own country's store, and only once that store
has MIN ratings. The numbers come from Apple's lookup API. If a lookup fails, the last known numbers (ratings.json,
beside this file) are used, so a build without the internet never loses the line.

Run by tools/website.py home (every build of the pages) and every day by .github/workflows/rating.yml.
Prints one line per language: what its page now shows."""
import json, os, re, urllib.request

APP = '6823997426'
MIN = 10
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
CACHE = os.path.join(HERE, 'ratings.json')


def polish(n):
    if n == 1: return 'ocena'
    if n % 10 in (2, 3, 4) and n % 100 not in (12, 13, 14): return 'oceny'
    return 'ocen'


# Each page: its file, its store's country, the decimal mark, the thousands separator, the words after the average,
# and the count with its noun (the plural rules of each language).
LANGS = {
    'en':    ('index.html',       'us', '.', ',',      'on the App Store',  lambda n, N: f'{N} rating' if n == 1 else f'{N} ratings'),
    'pl':    ('pl/index.html',    'pl', ',', ' ', 'w App Store',       lambda n, N: f'{N} {polish(n)}'),
    'de':    ('de/index.html',    'de', ',', '.',      'im App Store',      lambda n, N: f'{N} Bewertung' if n == 1 else f'{N} Bewertungen'),
    'fr':    ('fr/index.html',    'fr', ',', ' ', 'sur l’App Store',   lambda n, N: f'{N} note' if n < 2 else f'{N} notes'),
    'es':    ('es/index.html',    'es', ',', '.',      'en el App Store',   lambda n, N: f'{N} valoración' if n == 1 else f'{N} valoraciones'),
    'pt-br': ('pt-br/index.html', 'br', ',', '.',      'na App Store',      lambda n, N: f'{N} avaliação' if n < 2 else f'{N} avaliações'),
    'it':    ('it/index.html',    'it', ',', '.',      'su App Store',      lambda n, N: f'{N} valutazione' if n == 1 else f'{N} valutazioni'),
    'ja':    ('ja/index.html',    'jp', '.', ',',      'App Store',         lambda n, N: f'{N}件の評価'),
    'ko':    ('ko/index.html',    'kr', '.', ',',      'App Store',         lambda n, N: f'평가 {N}개'),
}

LINE = re.compile(r'<p class="top__rating"[^>]*>.*?</p>', re.S)
HIDDEN = '<p class="top__rating" data-rise style="--i:1" hidden></p>'


def fetch(country):
    url = f'https://itunes.apple.com/lookup?id={APP}&country={country}'
    with urllib.request.urlopen(url, timeout=10) as r:
        results = json.load(r).get('results') or []
    if not results: return {'average': 0, 'count': 0}
    return {'average': float(results[0].get('averageUserRating') or 0), 'count': int(results[0].get('userRatingCount') or 0)}


def line(lang, rating):
    page, country, mark, sep, store, count = LANGS[lang]
    n = rating['count']
    if n < MIN: return HIDDEN
    average = f"{rating['average']:.1f}".replace('.', mark)
    fill = round(rating['average'] / 5 * 100, 1)
    return (f'<p class="top__rating" data-rise style="--i:1"><a href="https://apps.apple.com/{country}/app/id{APP}" data-keep>'
            f'<span class="top__stars" style="--fill: {fill:g}%" aria-hidden="true">★★★★★</span> '
            f'<b>{average}</b> {store} · {count(n, f"{n:,}".replace(",", sep))}</a></p>')


def update(site=SITE):
    try: known = json.load(open(CACHE))
    except (OSError, ValueError): known = {}
    for lang, (page, country, *_) in LANGS.items():
        try:
            known[country] = fetch(country)
            source = 'App Store'
        except Exception as e:
            source = f'last known, the lookup failed: {e}'
        rating = known.get(country, {'average': 0, 'count': 0})
        path = os.path.join(site, page)
        html = open(path).read()
        new, n = LINE.subn(line(lang, rating), html, count=1)
        if n != 1: raise SystemExit(f'{page}: no <p class="top__rating"> to fill')
        if new != html: open(path, 'w').write(new)
        shown = 'shown' if rating['count'] >= MIN else f'hidden (under {MIN})'
        print(f"rating {lang}: {rating['average']:.1f} from {rating['count']} in {country}, {shown} ({source})")
    with open(CACHE, 'w') as f:
        json.dump(known, f, indent=1, sort_keys=True)
        f.write('\n')


if __name__ == '__main__':
    update()
