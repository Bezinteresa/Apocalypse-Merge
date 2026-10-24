"""Пересчитывает длины текстов в listing.md.

Длина ставится в строку перед блоком ``` в виде «(N/лимит)»; если в строке есть «(… N/лимит)», заменяется N.
Лимит берётся из этой же записи. Запуск: python Store/yandex/count_lengths.py
"""
import re
import sys
from pathlib import Path

path = Path(__file__).resolve().parent / 'listing.md'
lines = path.read_text(encoding='utf8').split('\n')
over = []
i = 0
while i < len(lines):
    if lines[i].startswith('```'):
        end = lines.index('```', i + 1)
        if lines[i] != '```':  # блоки с языком (команды) не считаем
            i = end + 1
            continue
        text = '\n'.join(lines[i + 1:end])
        head = max(j for j in range(i) if lines[j].strip())
        m = re.search(r'\((\d+)/(\d+)\)', lines[head])
        if m:
            n, limit = len(text), int(m.group(2))
            lines[head] = lines[head][:m.start()] + f'({n}/{limit})' + lines[head][m.end():]
            if n > limit:
                over.append(f'{lines[head]}: больше лимита')
            low = re.search(r'\((\d+)–\d+\)', lines[head])
            if low and n < int(low.group(1)):
                over.append(f'{lines[head]}: меньше минимума')
            print(lines[head])
        i = end + 1
        continue
    i += 1
path.write_text('\n'.join(lines), encoding='utf8')
if over:
    print('\n'.join(over))
    sys.exit(1)
