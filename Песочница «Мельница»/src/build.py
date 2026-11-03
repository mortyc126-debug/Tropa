"""Build the sandbox «Мельница» from the main game: python3 build.py   (writes ../index.html; or python3 build.py OUT_DIR)
The mill is part of the main game (Осенняя тропа (2)/index.html: PLACES.mill, its weir, wheel, flume and the rest, set by the world where the
map has it, at the end of the forest road from the dam). The sandbox is the
same page switched to its one-place mode: no endless trail, no map in the corner, the mill alone with the wood round it, the
same every time it is opened. To change the mill, edit the main game and build again. Every replacement must match exactly
once (or nothing is written)."""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'Осенняя тропа (2)', 'index.html')
out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..')
s = open(SRC, encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n:
        sys.exit(f'expected {n} match(es), found {c} for: {old[:100]!r}')
    s = s.replace(old, new)


rep('<title>Осенняя тропа</title>', '<title>Песочница «Мельница»</title>')
rep('aria-label="Осенняя тропа: езда по лесу"', 'aria-label="Песочница: свободная езда по месту карты"')
rep('<canvas id="map" width="96" height="128" aria-label="карта"></canvas>\n', '')
rep('<button id="bSeed" type="button" title="другой лес и другая тропа (турбаза, деревушка и дорога между ними остаются)">Новый лес</button><button id="bDev" type="button" hidden>Сетка: <b>выкл</b></button>',
    '<button id="bDev" type="button">Сетка: <b>выкл</b></button>')
rep('<div id="loading"><div class="plate" id="loadTxt">Строю лес…</div></div>', '<div id="loading"><div class="plate" id="loadTxt">Строю мельницу…</div></div>')
rep('const GAMEMODE = true;', 'const GAMEMODE = false; // (the sandbox: one fixed forest, the place looks the same every time it is opened)')
rep("const PL = PLACES[(new URLSearchParams(location.search)).get('place') || 'kluchi'] || PLACES.kluchi;",
    "const PL = PLACES[(new URLSearchParams(location.search)).get('place') || 'mill'] || PLACES.mill;")

os.makedirs(out_dir, exist_ok=True)
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(s)
print('built', out_dir, len(s), 'bytes')
