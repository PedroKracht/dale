import type { Quest, QuestCategory } from '../types';
import { QUESTS } from '../data/quests';

/**
 * SELECTOR DE QUESTS
 *
 * Objetivo: que la secuencia se sienta impredecible pero no repetitiva.
 * No hay orden, no hay progresión, no hay dificultad adaptativa (todavía).
 *
 * Cómo funciona: se descartan las quests recientes (filtro duro) y al resto se le
 * asigna un peso; después se sortea al azar ponderado. Todo lo ajustable vive en
 * WEIGHTS, así que cambiar el comportamiento es cambiar números, no lógica.
 */

/** Agrupación gruesa de categorías, para espaciar quests que "se sienten" parecidas. */
type Family = 'cuerpo' | 'juego' | 'gente' | 'atraccion';

const FAMILY: Record<QuestCategory, Family> = {
  presence: 'cuerpo',
  movement: 'cuerpo',
  music: 'juego',
  playful: 'juego',
  social: 'gente',
  stranger: 'gente',
  compliment: 'gente',
  conversation: 'gente',
  attraction: 'atraccion',
};

/** Multiplicadores de peso. <1 penaliza, >1 favorece. */
const WEIGHTS = {
  /** Misma categoría que la quest anterior. */
  sameCategoryAsLast: 0.06,
  /** Misma categoría que alguna de las dos anteriores. */
  sameCategoryRecent: 0.3,
  /** Misma familia que la anterior. */
  sameFamilyAsLast: 0.55,
  /** Tercera seguida de la misma familia (ej: tres de atracción). */
  thirdInFamilyRow: 0.03,
  /** Comparte un tag con la anterior (ej: dos preguntas iguales, dos de foto). */
  sharedTagWithLast: 0.35,
  /** Respiro: después de dos quests intensas seguidas, favorecer una tranquila. */
  breatherAfterIntense: 1.8,
  /** Ya salió en esta sesión (solo aplica cuando el mazo se está por agotar). */
  alreadyUsed: 0.12,
  /** Arrancar la noche con una quest intensa. Casi nunca: mala primera impresión. */
  intenseOpener: 0.04,
} as const;

/** No repetir ninguna de las últimas N quests mostradas. */
const RECENT_WINDOW = 8;
/** Debajo de esta cantidad de quests frescas, se empieza a reciclar el mazo. */
const MIN_FRESH_POOL = 6;
/** A partir de este nivel una quest cuenta como "intensa". */
const INTENSE_LEVEL = 3;

export type SelectionContext = {
  /** Todas las quests mostradas en la sesión, en orden. La última al final. */
  shownQuestIds: number[];
  /** Quests ya completadas, salteadas o abandonadas en esta sesión. */
  resolvedQuestIds: number[];
};

/**
 * Punto de extensión para el futuro (dificultad adaptativa, pesos por categoría,
 * quests que aparezcan más o menos). Hoy es neutro a propósito.
 */
export type Bias = (quest: Quest, ctx: SelectionContext) => number;

const neutralBias: Bias = () => 1;

function last<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

function byId(deck: Quest[], id: number | undefined): Quest | undefined {
  return id === undefined ? undefined : deck.find((q) => q.id === id);
}

export function scoreQuest(
  quest: Quest,
  ctx: SelectionContext,
  deck: Quest[],
  isFresh: boolean,
  bias: Bias,
): number {
  const recent = last(ctx.shownQuestIds, 3)
    .map((id) => byId(deck, id))
    .filter((q): q is Quest => q !== undefined)
    .reverse(); // [anterior, anteanterior, ...]

  const [prev, prev2] = recent;
  let weight = 1;

  if (ctx.shownQuestIds.length === 0 && quest.level >= INTENSE_LEVEL) {
    weight *= WEIGHTS.intenseOpener;
  }

  if (prev) {
    if (quest.category === prev.category) weight *= WEIGHTS.sameCategoryAsLast;
    if (FAMILY[quest.category] === FAMILY[prev.category]) weight *= WEIGHTS.sameFamilyAsLast;

    const prevTags = prev.tags ?? [];
    if ((quest.tags ?? []).some((t) => prevTags.includes(t))) weight *= WEIGHTS.sharedTagWithLast;
  }

  if (prev2) {
    if (quest.category === prev2.category) weight *= WEIGHTS.sameCategoryRecent;
    if (
      prev &&
      FAMILY[quest.category] === FAMILY[prev.category] &&
      FAMILY[quest.category] === FAMILY[prev2.category]
    ) {
      weight *= WEIGHTS.thirdInFamilyRow;
    }
    // Dos intensas seguidas: dar aire.
    if (prev && prev.level >= INTENSE_LEVEL && prev2.level >= INTENSE_LEVEL && quest.level <= 1) {
      weight *= WEIGHTS.breatherAfterIntense;
    }
  }

  if (!isFresh) weight *= WEIGHTS.alreadyUsed;

  return Math.max(weight * bias(quest, ctx), 0.0001);
}

function weightedPick(candidates: Quest[], weights: number[], random: () => number): Quest {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/**
 * Devuelve la próxima quest. `null` solo si el mazo está vacío.
 */
export function pickQuest(
  ctx: SelectionContext,
  deck: Quest[] = QUESTS,
  random: () => number = Math.random,
  bias: Bias = neutralBias,
): Quest | null {
  if (deck.length === 0) return null;

  const blocked = new Set(last(ctx.shownQuestIds, RECENT_WINDOW));
  let pool = deck.filter((q) => !blocked.has(q.id));

  // Mazo chico: al menos no repetir la que está en pantalla.
  if (pool.length === 0) {
    const currentId = ctx.shownQuestIds[ctx.shownQuestIds.length - 1];
    pool = deck.filter((q) => q.id !== currentId);
    if (pool.length === 0) pool = deck;
  }

  const resolved = new Set(ctx.resolvedQuestIds);
  const fresh = pool.filter((q) => !resolved.has(q.id));
  // Mientras quede mazo sin usar, se usa. Cuando se agota, se recicla con penalización.
  const candidates = fresh.length >= MIN_FRESH_POOL ? fresh : pool;

  const weights = candidates.map((q) => scoreQuest(q, ctx, deck, !resolved.has(q.id), bias));
  return weightedPick(candidates, weights, random);
}
