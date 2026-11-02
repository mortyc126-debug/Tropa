"""Build the sandbox «Дамба» from the main game: python3 build.py   (writes ../index.html; or python3 build.py OUT_DIR)
The dam across the bay is laid by the main game's world (Осенняя тропа (2)/index.html: damPlan, from the map's water and the road
between the camp and the fishing village), so the sandbox is the game's page with the world fixed (the same forest every time it is
opened), the rider put on the bike at the turning onto the dam, and the grid button shown: with the grid on, the dam's way is marked
every 10 m from the turning, and a tap on the ground or a thing says where it is on the dam (how far along, how far right or left of
its middle). To change the dam, edit the main game and build again. Every replacement must match exactly once (or nothing is
written)."""
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


rep('<title>Осенняя тропа</title>', '<title>Песочница «Дамба»</title>')
rep('aria-label="Осенняя тропа: езда по лесу"', 'aria-label="Песочница: дамба через залив"')
rep('<button id="bSeed" type="button" title="другой лес и другая тропа (турбаза, деревушка и дорога между ними остаются)">Новый лес</button><button id="bDev" type="button" hidden>Сетка: <b>выкл</b></button>',
    '<button id="bDev" type="button">Сетка: <b>выкл</b></button>')
rep('<div id="loading"><div class="plate" id="loadTxt">Строю лес…</div></div>', '<div id="loading"><div class="plate" id="loadTxt">Строю дамбу…</div></div>')
rep('const GAMEMODE = true;', 'const AT_DAM = 1; // (the sandbox: on the bike at the turning onto the dam)\nconst GAMEMODE = true;')
rep("if (GAMEMODE) { let s = null; try { s = localStorage.getItem('trail.seed') } catch (e) { } SEED = s ? +s : (Math.random() * 1e9) | 0; try { localStorage.setItem('trail.seed', SEED) } catch (e) { } } else SEED = 1234",
    'SEED = 1234 // (the sandbox: one fixed forest round the dam, the same every time it is opened)')
rep('if (GAMEMODE && !HERO0) heroPick(true);', '')
rep("if (GAMEMODE) $('bSeed').onclick", "if (false) $('bSeed').onclick")

os.makedirs(out_dir, exist_ok=True)
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(s)
print('built', out_dir, len(s), 'bytes')
