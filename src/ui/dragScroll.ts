// Общая прокрутка перетаскиванием для лент интерфейса: сцена магазина, ряд заказов, карты альбома.

/**
 * Горизонтальная прокрутка перетаскиванием пальцем или мышью. Короткое касание остаётся нажатием
 * (кнопка заказа, место ремонта), после перетаскивания нажатие не срабатывает.
 */
export function dragScroll(el: HTMLElement): void {
  el.classList.add('drag-scroll');
  let pan: { id: number; x: number; left: number; moved: boolean } | null = null;
  el.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    pan = { id: e.pointerId, x: e.clientX, left: el.scrollLeft, moved: false };
  });
  el.addEventListener('pointermove', (e) => {
    if (!pan || e.pointerId !== pan.id) return;
    const dx = e.clientX - pan.x;
    // порог: короткое касание остаётся нажатием
    if (!pan.moved && Math.abs(dx) < 8) return;
    if (!pan.moved) {
      if (el.scrollWidth <= el.clientWidth) return;
      pan.moved = true;
      // захват может не удаться (указатель уже отпущен) — прокрутка работает и без него
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* без захвата */
      }
      el.classList.add('panning');
    }
    el.scrollLeft = pan.left - dx;
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
