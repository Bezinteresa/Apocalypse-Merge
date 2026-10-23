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
  // глава 2: гараж
  {
    id: 'D_GARAGE',
    after: { project: 'R09' },
    lines: [
      { speaker: 'MARTA', text: { ru: 'Гараж живой! Стеллаж с запчастями цел — будет из чего собирать.', en: 'The garage lives! The parts rack survived — plenty to build from.' } },
      { speaker: 'MARTA', text: { ru: 'Если поставим машину на ход, к нам потянутся караваны.', en: 'If we get a vehicle running, caravans will come our way.' } },
    ],
  },
  {
    id: 'D_SAVVA',
    after: { project: 'R10' },
    lines: [
      { speaker: 'SAVVA', text: { ru: 'Здоро́во. Я Савва, вожу караван между кварталами. Фургон встал в двух улицах отсюда.', en: "Hey. I'm Savva, I drive a caravan between districts. My van broke down two streets away." } },
      { speaker: 'SAVVA', text: { ru: 'Поможете с запчастями — буду возить вам товар со всего города.', en: "Help me with parts and I'll bring you goods from all over the city." } },
    ],
  },
  {
    id: 'D_VAN',
    after: { project: 'R12' },
    lines: [
      { speaker: 'SAVVA', text: { ru: 'Заводится! Первый рейс — за вами. Соберите груз, и в путь.', en: "It starts! The first run is on you. Load the cargo and we're off." } },
      { speaker: 'MARTA', text: { ru: 'Когда фургон съехал с ямы, под ним в полу нашёлся люк. Тот самый кабель уходит туда.', en: 'When the van rolled off the pit, there was a hatch in the floor. That cable goes down there.' } },
    ],
  },
  {
    id: 'D_DESCENT',
    after: { project: 'R13' },
    lines: [
      { speaker: 'MARTA', text: { ru: 'Люк открыт. Внизу лестница и сухой воздух — там кто-то жил.', en: 'The hatch is open. A ladder and dry air below — someone lived there.' } },
      { speaker: 'LEV', text: { ru: 'Так вот откуда радио… Убежище прямо под «Перекрёстком».', en: 'So that is where the radio came from… The shelter is right under the "Crossroads".' } },
      { speaker: 'NIKA', text: { ru: 'Возьмём фонари и аптечку. Спустимся вместе.', en: "Let's take lamps and a first-aid kit. We go down together." } },
    ],
  },
];
