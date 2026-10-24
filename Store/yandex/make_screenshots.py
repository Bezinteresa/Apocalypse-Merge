"""Скриншоты для Яндекс Игр: десктоп 1920×1080 и телефон 1080×1920 на ru и en.

Снимает собранную игру через headless Chrome (CDP), без системного интерфейса.
Перед запуском: npm run build и npm run preview -- --port 4173 --strictPort (или preview_start «preview»).
Запуск из корня проекта: python Store/yandex/make_screenshots.py
Нужен пакет websockets (pip install websockets).

Прогресс — подготовленное сохранение середины 2-й главы (гараж), оно кладётся в localStorage
до запуска игры; язык — подмена navigator.language (локальный Bridge в режиме mock берёт язык оттуда).
Кнопка DBG (видна только на localhost) на снимках скрыта стилем.
"""
import asyncio
import base64
import json
import os
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

import websockets

# IPv6-адрес: на 127.0.0.1:4173 может отвечать сервер другого проекта
URL = 'http://[::1]:4173/'
OUT = Path(__file__).resolve().parent / 'screenshots'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9333

# (имя, CSS-ширина, CSS-высота, масштаб, мобильный) → итог 1920×1080 и 1080×1920
DEVICES = [('desktop', 1280, 720, 1.5, False), ('mobile', 540, 960, 2, True)]
# (имя, кнопка или None для поля)
SCREENS = [('1_board', None), ('2_shop', '.shop-btn'), ('3_album', '.album-btn')]


def item(uid: int, item_id: str) -> dict:
    return {'kind': 'item', 'uid': uid, 'itemId': item_id}


def gen(generator_id: str, level: int) -> dict:
    return {'kind': 'generator', 'generatorId': generator_id, 'level': level}


def make_save() -> dict:
    """Середина главы 2: гараж открыт, Савва пришёл, текущий ремонт — подъёмник (R11)."""
    rows = [
        ['T01', 'T02', 'M01', None, 'P01', 'E01', 'A01'],
        ['M02', None, 'T03', 'P02', None, 'E02', 'A01'],
        [None, 'G_TOOL:6', None, 'M03', 'G_MATERIAL:5', None, 'A02'],
        ['T01', 'P02', None, 'T02', None, 'M02', None],
        ['E01', None, 'G_PROVISION:5', None, 'G_ELECTRIC:4', 'E03', 'P03'],
        [None, 'M04', 'P01', 'T04', None, None, 'E02'],
        ['A02', None, 'G_AUTO:4', None, 'A03', 'M01', None],
        ['T02', 'P01', None, 'M03', 'E01', None, 'T01'],
        [None, 'M02', 'A01', None, 'P02', 'T03', None],
    ]
    cells, uid = [], 1
    for token in (t for row in rows for t in row):
        if token is None:
            cells.append(None)
        elif token.startswith('G_'):
            gid, level = token.split(':')
            cells.append(gen(gid, int(level)))
        else:
            cells.append(item(uid, token))
            uid += 1
    storage = []
    for token in ['T04', 'E04', 'P04', 'M04', None, None, None, None, None, None]:
        storage.append(item(uid, token) if token else None)
        uid += token is not None
    projects = ['R01', 'C01', 'R02', 'R03', 'C02', 'R04', 'C03', 'R05', 'R06', 'C04', 'R07', 'R08', 'C05', 'R09', 'R10', 'C06']
    orders = [f'O{i:02d}' for i in range(1, 22)]
    dialogs = ['D_INTRO', 'D_AFTER_O01', 'D_AFTER_R01', 'D_AFTER_R02', 'D_AFTER_R03', 'D_NIKA', 'D_AFTER_R04', 'D_MARTA',
               'D_AFTER_R06', 'D_AFTER_R07', 'D_FINALE', 'D_GARAGE', 'D_SAVVA']
    discovered = sorted({f'{c}{l:02d}' for c, top in (('T', 5), ('M', 5), ('P', 5), ('E', 5), ('A', 3)) for l in range(1, top + 1)})
    flags = ['web_freed', 'storage_used', 'chain_opened', 'gen_merged'] + [f'spawn:{g}' for g in ('G_TOOL', 'G_MATERIAL', 'G_PROVISION', 'G_ELECTRIC', 'G_AUTO')]
    return {
        'schemaVersion': 13,
        'cells': cells,
        'fog': [None] * 63,
        'discovered': discovered,
        'storage': storage,
        'money': 265,
        'nextUid': uid,
        'completedOrders': orders,
        'completedProjects': projects,
        'lastSale': None,
        'seenDialogs': dialogs,
        'incoming': [],
        'energy': 84,
        'energyUpdatedAt': int(time.time() * 1000) + 3600_000,
        'energyUnlimited': False,
        'collections': {'S_OLD_WORLD': {
            'shards': {'C_POSTCARD': 2, 'C_METRO_MAP': 3, 'C_ARCHIVE_KEY': 1},
            'assembled': ['C_TRAM_TICKET', 'C_TIN_TOY', 'C_SEEDS', 'C_RADIO'],
            'pity': 9,
            'rewardClaimed': False,
        }},
        'tokens': 6,
        'chests': [],
        'rng': 12345,
        'lastChest': None,
        'adRewards': {'used': 0, 'cooldownUntil': 0},
        'flags': flags,
        'soundOn': False,
    }


def boot_script(lang: str, save: dict) -> str:
    return f"""
Object.defineProperty(Navigator.prototype, 'language', {{ get: () => '{lang}' }});
Object.defineProperty(Navigator.prototype, 'languages', {{ get: () => ['{lang}'] }});
localStorage.setItem('am_save', {json.dumps(json.dumps(save))});
localStorage.removeItem('am_save_prev');
document.addEventListener('DOMContentLoaded', () => {{
  const s = document.createElement('style');
  s.textContent = '.debug-btn {{ display: none !important; }}';
  document.head.appendChild(s);
}});
"""


class Cdp:
    def __init__(self, ws):
        self.ws, self.n = ws, 0

    async def call(self, method: str, **params):
        self.n += 1
        await self.ws.send(json.dumps({'id': self.n, 'method': method, 'params': params}))
        while True:
            msg = json.loads(await self.ws.recv())
            if msg.get('id') == self.n:
                if 'error' in msg:
                    raise RuntimeError(f'{method}: {msg["error"]}')
                return msg.get('result', {})

    async def js(self, expr: str):
        r = await self.call('Runtime.evaluate', expression=expr, awaitPromise=True, returnByValue=True)
        return r.get('result', {}).get('value')


async def shoot(cdp: Cdp, lang: str, device: tuple, save: dict) -> None:
    name, w, h, scale, mobile = device
    await cdp.call('Emulation.setDeviceMetricsOverride', width=w, height=h, deviceScaleFactor=scale, mobile=mobile)
    await cdp.call('Emulation.setTouchEmulationEnabled', enabled=mobile)
    script = await cdp.call('Page.addScriptToEvaluateOnNewDocument', source=boot_script(lang, save))
    for screen, button in SCREENS:
        if name == 'desktop' and screen == '3_album':
            continue  # на ПК альбом — узкая колонка посередине, игровая часть меньше 70% кадра
        await cdp.call('Page.navigate', url=URL)
        for _ in range(60):
            await asyncio.sleep(0.25)
            if await cdp.js("!!document.querySelector('#board .cell, #board > *')"):
                break
        await asyncio.sleep(1.5)
        if button:
            await cdp.js(f"document.querySelector('{button}').click()")
            await asyncio.sleep(1.5)
        if await cdp.js('document.title') != 'Apocalypse Merge':
            raise RuntimeError(f'{URL} отдаёт другую страницу')
        shot = await cdp.call('Page.captureScreenshot', format='png')
        path = OUT / f'{name}_{lang}_{screen}.png'
        path.write_bytes(base64.b64decode(shot['data']))
        print(path.name, await cdp.js('document.documentElement.lang'))
    await cdp.call('Page.removeScriptToEvaluateOnNewDocument', identifier=script['identifier'])


async def main() -> None:
    OUT.mkdir(exist_ok=True)
    profile = tempfile.mkdtemp(prefix='am_shots_')
    chrome = subprocess.Popen([CHROME, '--headless=new', f'--remote-debugging-port={PORT}', f'--user-data-dir={profile}',
                               '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank'])
    try:
        for _ in range(40):
            try:
                targets = json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json'))
                page = next(t for t in targets if t['type'] == 'page')
                break
            except Exception:
                time.sleep(0.25)
        async with websockets.connect(page['webSocketDebuggerUrl'], max_size=2**27, ping_interval=None) as ws:
            cdp = Cdp(ws)
            await cdp.call('Page.enable')
            save = make_save()
            for lang in ('ru', 'en'):
                for device in DEVICES:
                    await shoot(cdp, lang, device, save)
    finally:
        chrome.terminate()


if __name__ == '__main__':
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    asyncio.run(main())
