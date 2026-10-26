"""Render sketch scenes: python3 run.py scene.js [scene2.js ...] -> out/<name>.png (each scene may export several)."""
import asyncio, base64, os, subprocess, sys, time
from urllib.parse import quote
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8791
# the game the scenes are drawn from: $GAME, else game.html next to this file, else the game in this repository
# (with window.__SKETCH set, the game hands its generators over as window.G and does not start)
GAME = os.environ.get('GAME') or next((p for p in [os.path.join(HERE, 'game.html'), os.path.join(HERE, '..', '..', 'Осенняя тропа (2)', 'index.html')] if os.path.exists(p)), None)
if not GAME:
    sys.exit('no game found: put game.html next to run.py or set GAME=path/to/index.html')
GAME = os.path.abspath(GAME)


async def main(scenes):
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '-d', os.path.dirname(GAME)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(.8)
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    try:
        async with async_playwright() as pw:
            b = await pw.chromium.launch()
            for sc in scenes:
                p = await b.new_page()
                errs = []
                p.on('pageerror', lambda e: errs.append(str(e)))
                await p.route('**/fonts.googleapis.com/**', lambda r: r.abort())
                await p.add_init_script('window.__SKETCH=1')
                await p.goto(f'http://localhost:{PORT}/{quote(os.path.basename(GAME))}')
                await p.wait_for_function('!!window.G')
                await p.add_script_tag(path=os.path.join(HERE, 'lib.js'))
                await p.add_script_tag(path=os.path.join(HERE, sc))
                outs = await p.evaluate('window.SCENE()')
                for name, url in outs.items():
                    fn = os.path.join(HERE, 'out', name + '.png')
                    open(fn, 'wb').write(base64.b64decode(url.split(',', 1)[1]))
                    print('wrote', fn)
                if errs:
                    print('ERRORS', sc, errs)
                await p.close()
            await b.close()
    finally:
        srv.terminate()


asyncio.run(main(sys.argv[1:]))
