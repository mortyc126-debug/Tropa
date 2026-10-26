"""Render sketch scenes: python3 run.py scene.js [scene2.js ...] -> out/<name>.png (each scene may export several)."""
import asyncio, base64, os, subprocess, sys, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8791


async def main(scenes):
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '-d', HERE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
                await p.goto(f'http://localhost:{PORT}/game.html')
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
