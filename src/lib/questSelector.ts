import type { Outcome, Quest, QuestCategory } from '../types';
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
  /** Cómo terminaron las últimas quests, en orden. Con esto se calcula el envión. */
  recentOutcomes: Outcome[];
};

export type Bias = (quest: Quest, ctx: SelectionContext) => number;

/**
 * DIFICULTAD ADAPTATIVA
 *
 * Cuántos resultados miramos para atrás. Corto a propósito: la noche tiene que
 * poder cambiar de humor en diez minutos, no arrastrar lo que pasó a las 2 AM.
 */
const MOMENTUM_WINDOW = 5;

/**
 * Cuánto mueve la aguja cada resultado.
 *
 * "No va" vale cero: descartar una quest habla de la quest, no de vos. Bajarte el
 * nivel por eso sería castigarte por tener criterio.
 */
const OUTCOME_POINTS: Record<Outcome, number> = {
  completed: 1,
  skipped: -1,
  abandoned: -0.5,
  disliked: 0,
};

/** Nivel al que apunta la noche cuando no hay historia todavía. */
const BASE_LEVEL = 2;
/** Cuánto puede correrse ese nivel con el envión a favor o en contra. */
const LEVEL_SWING = 1.8;
/** Cuánto pierde una quest por cada nivel de distancia del objetivo.
 *  Es un empujón, no un filtro: el azar tiene que seguir mandando.
 *  Medido sobre el mazo actual: cumpliendo, la mitad de lo que sale es nivel 3+;
 *  salteando, baja a menos de un cuarto. Apretar más no mueve mucho la aguja y
 *  empieza a volver la noche predecible. */
const LEVEL_FALLOFF = 0.45;

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * Si venís salteando, baja. Si venís cumpliendo, sube. Nunca de golpe: cinco
 * resultados seguidos en la misma dirección mueven el objetivo un nivel y medio.
 */
export const momentumBias: Bias = (quest, ctx) => {
  const recientes = last(ctx.recentOutcomes, MOMENTUM_WINDOW);
  if (recientes.length === 0) return 1;

  const envion = recientes.reduce((a, o) => a + OUTCOME_POINTS[o], 0) / recientes.length;
  const objetivo = clamp(BASE_LEVEL + envion * LEVEL_SWING, 0, 4);

  return LEVEL_FALLOFF ** Math.abs(quest.level - objetivo);
};

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
  bias: Bias = momentumBias,
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
