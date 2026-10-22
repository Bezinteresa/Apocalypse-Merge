// Builds art/ART_TODO.md: only the pictures that still have to be generated.
// Source of truth: art/generation-prompts.json (every asset with file, w, h, subject).
// An asset is in the to-do list when its file is missing in public/sprites, has a different size,
// or has "redo": "<reason>" in its spec. Run: node art/art_todo.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const sprites = path.join(root, 'public/sprites')
const spec = JSON.parse(fs.readFileSync(path.join(here, 'generation-prompts.json'), 'utf8'))

/** Width and height from a PNG or WebP header (no image library needed). */
function imageSize(file) {
  const b = fs.readFileSync(file)
  if (b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = b.toString('ascii', 12, 16)
    if (chunk === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) }
    if (chunk === 'VP8L') {
      const bits = b.readUInt32LE(21)
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 }
    }
    if (chunk === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }
  }
  return null
}

const todo = []
for (const a of spec.assets) {
  const file = path.join(sprites, a.file)
  let reason = ''
  if (!fs.existsSync(file)) reason = 'новая картинка'
  else if (a.redo) reason = `переделать: ${a.redo}`
  else {
    const size = imageSize(file)
    if (!size) reason = 'файл не читается как PNG/WebP'
    else if (size.w !== a.w || size.h !== a.h) reason = `другой размер: сейчас ${size.w}×${size.h}, нужно ${a.w}×${a.h}`
  }
  if (reason) todo.push({ ...a, reason })
}

const lines = [
  '# Что сгенерировать сейчас',
  '',
  `Файл создан скриптом \`node art/art_todo.mjs\` (${new Date().toLocaleString('ru-RU')}). Генерируй **только** картинки из этого списка — остальные уже готовы.`,
  '',
  '**Порядок работы — в [art/README.md](README.md):** как собрать запрос, куда сохранить, как записать в `art/generation-log.json` и что закоммитить. Готовое исчезает из этого списка само, когда файл нужного размера лежит в `public/sprites/`.',
  '',
  `Стиль: ${spec.style}`,
  `Референс: ${spec.reference} — прикладывай к каждой генерации`,
  `Правила: ${spec.constraints}`,
  '',
  'Готовую картинку сохраняй в `public/sprites/<файл>` точно указанного размера:',
  '`python art/save_generated_asset.py <исходник> <файл> <ширина> <высота> [--trim]` (`--trim` — для items/, generators/, chests/ и иконок; для переделки добавь `--replace`). Затем допиши запись в `art/generation-log.json`.',
  'Потом сожми тяжёлые картинки: `python art/compress_sprites.py` (оригиналы останутся в art/originals).',
  'Проверь всё разом: `python art/verify_generated_assets.py` (превью в art/generated-previews).',
  'После этого снова запусти `node art/art_todo.mjs` — сделанное пропадёт из списка.',
  '',
]
if (!todo.length) lines.push('**Всё готово — генерировать нечего.**')
else {
  lines.push(`Осталось: **${todo.length}**`, '')
  for (const a of todo) {
    lines.push(`## ${a.file} — ${a.w}×${a.h}`, '', `- Почему: ${a.reason}`, `- Что: ${a.subject}`)
    if (a.extra) lines.push(`- Кадр: ${a.extra}`)
    if (a.guide) lines.push(`- Приложи как основу для правки: ${a.guide}`)
    lines.push('')
  }
}
fs.writeFileSync(path.join(here, 'ART_TODO.md'), lines.join('\n'), 'utf8')
console.log(todo.length ? `To do: ${todo.length}` : 'Nothing to generate.')
