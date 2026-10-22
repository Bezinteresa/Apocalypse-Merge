import type { LangText } from './items';

// Короткие сюжетные сцены первой главы (GAME_DESIGN, раздел 10). Тексты — рабочие, для прототипа.

export interface DialogLine {
  speaker: string;
  text: LangText;
}

export interface DialogDef {
  id: string;
  /** Условие показа: заказ или проект, после которого сцена становится доступной; null — с начала. */
  after: { order: string } | { project: string } | null;
  lines: DialogLine[];
}

export const DIALOGS: DialogDef[] = [
  {
    id: 'D_INTRO',
    after: null,
    lines: [
      { speaker: 'LEV', text: { ru: 'Эй, хозяин! Говорят, ты занял старый магазин на перекрёстке.', en: 'Hey, boss! Word is you took over the old shop at the crossroads.' } },
      { speaker: 'LEV', text: { ru: 'Место разбито, но людям нужны вещи. Начнём с малого?', en: "The place is wrecked, but people need things. Let's start small?" } },
      { speaker: 'LEV', text: { ru: 'Мне нужны пассатижи — закрепить табличку. Загляни в ящик с инструментами.', en: 'I need pliers to fix a sign. Check the toolbox.' } },
    ],
  },
  {
    id: 'D_AFTER_O01',
    after: { order: 'O01' },
    lines: [
      { speaker: 'LEV', text: { ru: 'Спасибо! Держи монеты.', en: 'Thanks! Here are your coins.' } },
      { speaker: 'LEV', text: { ru: 'Только вход у тебя завален. Собери детали из металлолома и расчисти проход.', en: 'But your entrance is blocked. Make some parts from scrap and clear the way.' } },
    ],
  },
  {
    id: 'D_AFTER_R01',
    after: { project: 'R01' },
    lines: [
      { speaker: 'LEV', text: { ru: 'Вот это другое дело! Теперь сюда можно зайти.', en: "Now that's better! People can actually get in." } },
      { speaker: 'LEV', text: { ru: 'Дальше — прилавок. Без него какая торговля? А я пока принесу ещё просьб.', en: "Next is the counter. No trade without it. I'll bring more requests meanwhile." } },
    ],
  },
  {
    id: 'D_AFTER_R02',
    after: { project: 'R02' },
    lines: [{ speaker: 'LEV', text: { ru: 'Прилавок как новый. Слух о тебе уже пошёл по кварталу.', en: 'The counter looks brand new. Word is spreading around the block.' } }],
  },
  {
    id: 'D_AFTER_R03',
    after: { project: 'R03' },
    lines: [
      { speaker: 'LEV', text: { ru: 'Полка готова. Знаю девушку из пункта помощи — Нику.', en: 'The shelf is ready. I know a girl from the aid post, Nika.' } },
      { speaker: 'LEV', text: { ru: 'Ей пригодятся припасы. Я передам, что здесь снова торгуют.', en: "She'll need supplies. I'll tell her the shop is open again." } },
    ],
  },
];
