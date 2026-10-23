// Общая прокрутка перетаскиванием: сцена магазина и ряд заказов (по горизонтали), альбом (по вертикали).

/**
 * Прокрутка перетаскиванием пальцем или мышью. Короткое касание остаётся нажатием
 * (кнопка заказа, место ремонта), после перетаскивания нажатие не срабатывает.
 * По вертикали палец листает страницу сам (обычная прокрутка браузера), поэтому там перетаскивание
 * добавляется только мыши.
 */
export function dragScroll(el: HTMLElement, axis: 'x' | 'y' = 'x'): void {
  el.classList.add(axis === 'x' ? 'drag-scroll' : 'drag-scroll-y');
  let pan: { id: number; start: number; from: number; moved: boolean } | null = null;
  const pos = (e: PointerEvent) => (axis === 'x' ? e.clientX : e.clientY);
  const scrollable = () => (axis === 'x' ? el.scrollWidth > el.clientWidth : el.scrollHeight > el.clientHeight);
  el.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || (axis === 'y' && e.pointerType !== 'mouse')) return;
    pan = { id: e.pointerId, start: pos(e), from: axis === 'x' ? el.scrollLeft : el.scrollTop, moved: false };
  });
  el.addEventListener('pointermove', (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    const d = pos(e) - pan.start;
    // порог: короткое касание остаётся нажатием
    if (!pan.moved && Math.abs(d) < 8) return;
    if (!pan.moved) {
      if (!scrollable()) return;
      pan.moved = true;
      // захват может не удаться (указатель уже отпущен) — прокрутка работает и без него
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* без захвата */
      }
      el.classList.add('panning');
    }
    if (axis === 'x') el.scrollLeft = pan.from - d;
    else el.scrollTop = pan.from - d;
  });
  const end = (e: PointerEvent) => {
    if (!pan || e.pointerId !== pan.id) return;
    if (pan.moved) {
      el.addEventListener('click', (c) => c.stopPropagation(), { capture: true, once: true });
      setTimeout(() => el.classList.remove('panning'), 0);
    }
    pan = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
