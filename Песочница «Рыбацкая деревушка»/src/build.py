"""Build the sandbox «Рыбацкая деревушка» from the main game: python3 build.py   (writes ../index.html; or python3 build.py OUT_DIR)
The village is part of the main game now (Осенняя тропа (2)/index.html: its prefabs, its water, birds, gulls and the rest, and
PLACES.buhta, are all in there, and the world sets it 1.1 km east of the camp at the end of the forest road). The sandbox is the
same page switched to its one-place mode: no endless trail, no map in the corner, the village alone with the wood round it, the
same every time it is opened. To change the village, edit the main game and build again. Every replacement must match exactly
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


rep('<title>Осенняя тропа</title>', '<title>Песочница «Рыбацкая деревушка»</title>')
rep('aria-label="Осенняя тропа: езда по лесу"', 'aria-label="Песочница: свободная езда по месту карты"')
rep('<canvas id="map" width="96" height="128" aria-label="карта"></canvas>\n', '')
rep('<button id="bSeed" type="button" title="другой лес и другая тропа (турбаза, деревушка и дорога между ними остаются)">Новый лес</button><button id="bDev" type="button" hidden>Сетка: <b>выкл</b></button>',
    '<button id="bDev" type="button">Сетка: <b>выкл</b></button>')
rep('<div id="loading"><div class="plate" id="loadTxt">Строю лес…</div></div>', '<div id="loading"><div class="plate" id="loadTxt">Строю место…</div></div>')
rep('const GAMEMODE = true;', 'const GAMEMODE = false; // (the sandbox: one fixed forest, the place looks the same every time it is opened)')
rep("const PL = PLACES[(new URLSearchParams(location.search)).get('place') || 'kluchi'] || PLACES.kluchi;",
    "const PL = PLACES[(new URLSearchParams(location.search)).get('place') || 'buhta'] || PLACES.buhta;")

os.makedirs(out_dir, exist_ok=True)
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(s)
print('built', out_dir, len(s), 'bytes')
