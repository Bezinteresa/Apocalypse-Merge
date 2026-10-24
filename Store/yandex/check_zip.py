"""Проверка ZIP для Яндекс Игр: index.html в корне, пути через '/', без пробелов и кириллицы, < 100 МБ.

Запуск: python Store/yandex/check_zip.py Store/yandex/apocalypse-merge-0.4.0-yandex.zip
"""
import re
import sys
import zipfile

path = sys.argv[1]
z = zipfile.ZipFile(path)
names = z.namelist()
unpacked = sum(i.file_size for i in z.infolist())
problems = []

if 'index.html' not in names:
    problems.append('нет index.html в корне')
if sum(1 for n in names if n.split('/')[-1] == 'index.html') != 1:
    problems.append('index.html должен быть ровно один')
problems += [f'обратный слеш: {n}' for n in names if '\\' in n]
problems += [f'пробел или кириллица: {n}' for n in names if re.search(r'[\sЀ-ӿ]', n)]
problems += [f'неиспользуемый файл: {n}' for n in names if n.endswith('sprites/ui/cell.png')]
if unpacked >= 100 * 1024 * 1024:
    problems.append(f'распакованный размер {unpacked} байт >= 100 МБ')

print(f'{path}: {len(names)} файлов, распаковано {unpacked / 1024 / 1024:.2f} МБ')
for n in names:
    if n.endswith(('.js', '.css', '.html')):
        hosts = sorted(set(re.findall(r'https?://[a-zA-Z0-9.\-]+', z.read(n).decode('utf8', 'ignore'))))
        print(f'  внешние адреса в {n}: {", ".join(hosts) or "нет"}')
print('OK' if not problems else '\n'.join(['ОШИБКИ:'] + problems))
sys.exit(1 if problems else 0)
