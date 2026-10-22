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
  {
    id: 'D_NIKA',
    after: { project: 'R03' },
    lines: [
      { speaker: 'NIKA', text: { ru: 'Привет! Лев сказал, у вас снова можно найти еду.', en: 'Hi! Lev said I can find food here again.' } },
      { speaker: 'NIKA', text: { ru: 'В пункте помощи всегда кто-то голодный. Я буду заходить за припасами.', en: "Someone at the aid post is always hungry. I'll come by for supplies." } },
    ],
  },
  {
    id: 'D_AFTER_R04',
    after: { project: 'R04' },
    lines: [{ speaker: 'NIKA', text: { ru: 'Склад теперь как у настоящего магазина. Можно запасаться впрок.', en: 'The storeroom looks like a real shop now. We can stock up.' } }],
  },
  {
    id: 'D_MARTA',
    after: { project: 'R05' },
    lines: [
      { speaker: 'MARTA', text: { ru: 'Я Марта, механик. Твой верстак видно с улицы.', en: "I'm Marta, a mechanic. Your workbench is visible from the street." } },
      { speaker: 'MARTA', text: { ru: 'Странно: к магазину идёт старая линия питания. На схемах квартала её нет.', en: "Odd: an old power line runs to the shop. It's not on any district map." } },
      { speaker: 'MARTA', text: { ru: 'Принеси провода и детали — попробуем её оживить.', en: "Bring wires and parts and we'll try to bring it back." } },
    ],
  },
  {
    id: 'D_AFTER_R06',
    after: { project: 'R06' },
    lines: [
      { speaker: 'MARTA', text: { ru: 'Свет есть! И слышишь? В старом радио что-то шипит.', en: 'We have light! And hear that? The old radio is hissing.' } },
      { speaker: 'MARTA', text: { ru: 'Кто-то ещё пользуется этой линией. Надо будет разобраться.', en: 'Someone else is using this line. We should figure it out.' } },
    ],
  },
  {
    id: 'D_AFTER_R07',
    after: { project: 'R07' },
    lines: [{ speaker: 'NIKA', text: { ru: 'Чистая вода прямо у магазина! Теперь сюда потянутся все.', en: 'Clean water right by the shop! Everyone will come here now.' } }],
  },
  {
    id: 'D_FINALE',
    after: { project: 'R08' },
    lines: [
      { speaker: 'LEV', text: { ru: '«Перекрёсток» открыт! Во дворе очередь, как в старые времена.', en: 'The "Crossroads" is open! There is a queue in the yard, like the old days.' } },
      { speaker: 'MARTA', text: { ru: 'Тихо! Радио… Сигнал стал чище.', en: 'Quiet! The radio… the signal is clearer.' } },
      { speaker: 'RADIO', text: { ru: '«…всем, кто слышит… убежище под перекрёстком… ответьте…»', en: '"…anyone who hears this… shelter under the crossroads… respond…"' } },
      { speaker: 'NIKA', text: { ru: 'Под перекрёстком? Это же прямо под нами.', en: "Under the crossroads? That's right below us." } },
    ],
  },
];
