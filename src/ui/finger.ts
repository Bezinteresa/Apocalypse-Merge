import type { Hint } from '../game/hints';
import { tx } from '../i18n';
import { spriteImg, uiSprite } from './sprites';

// Палец-подсказка поверх интерфейса: нажатие (покачивание над целью) или перетаскивание (ход от предмета к цели).
// Где находится цель, решает экран игры (resolve): клетки, кнопки и окна меняются в зависимости от того, что открыто.

export interface FingerTargets {
  /** Элемент, на который показывает палец; для перетаскивания — откуда. */
  from: HTMLElement;
  /** Для перетаскивания — куда. */
  to?: HTMLElement;
}

export class Finger {
  private el: HTMLElement;
  private hand: HTMLElement;
  private text: HTMLElement;
  private hint: Hint | null = null;
  private key = '';

  constructor(private resolve: (hint: Hint) => FingerTargets | null) {
    this.el = document.createElement('div');
    this.el.className = 'finger';
    this.el.hidden = true;
    this.hand = document.createElement('div');
    this.hand.className = 'finger-hand';
    const img = spriteImg(uiSprite('finger'), 'finger-img');
    if (img) this.hand.appendChild(img);
    else this.hand.textContent = '👆';
    // текст — отдельной плашкой внизу экрана, чтобы не закрывать поле и предметы
    this.text = document.createElement('div');
    this.text.className = 'finger-text';
    this.text.hidden = true;
    this.el.append(this.hand);
    document.body.append(this.el, this.text);
    window.addEventListener('resize', () => this.place());
    // интерфейс перестраивается без событий (открытие окон, прокрутка) — сверяем положение регулярно
    setInterval(() => this.place(), 400);
  }

  show(hint: Hint | null): void {
    this.hint = hint;
    this.place();
  }

  private place(): void {
    const targets = this.hint ? this.resolve(this.hint) : null;
    const visible = !!targets && targets.from.offsetParent !== null && (!targets.to || targets.to.offsetParent !== null);
    this.el.hidden = !visible;
    this.text.hidden = !visible;
    if (!visible || !this.hint) return;
    const a = targets.from.getBoundingClientRect();
    const b = targets.to?.getBoundingClientRect();
    const x = a.left + a.width / 2;
    const y = a.top + a.height / 2;
    const key = `${this.hint.id}|${Math.round(x)}|${Math.round(y)}|${b ? `${Math.round(b.left)}|${Math.round(b.top)}` : ''}`;
    if (key === this.key) return;
    this.key = key;
    this.text.textContent = tx(this.hint.text);
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
    this.el.classList.toggle('drag', !!b);
    this.el.style.setProperty('--dx', b ? `${b.left + b.width / 2 - x}px` : '0px');
    this.el.style.setProperty('--dy', b ? `${b.top + b.height / 2 - y}px` : '0px');
    // если цель сама у нижнего края (склад, панель), плашка уходит наверх
    this.text.classList.toggle('top', y > window.innerHeight - 140 || (!!b && b.top + b.height / 2 > window.innerHeight - 140));
  }
}
