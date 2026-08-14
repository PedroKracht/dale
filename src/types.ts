/**
 * LA ESCALERA. Metadata interna: nunca se muestra al usuario.
 *
 * El eje es uno solo: cuánto te estás mostrando sin controlar el resultado.
 *
 *  0 — No te registra nadie. Moverte, mirar, decidir.
 *  1 — Te pueden ver, pero no hay nadie del otro lado esperando nada.
 *  2 — Hay alguien del otro lado y lo que hacés es liviano.
 *  3 — Te mostrás de una forma que puede salir mal: quedar en ridículo, decir algo
 *      sincero, ser el primero, meterte donde no te llamaron.
 *  4 — Le pedís algo a alguien que te lo puede negar.
 *
 * Que te rechace alguien que te gusta es UN caso del 4, no su definición. La versión
 * vieja de esta escalera ponía el rechazo romántico en el centro, y el resultado era
 * que "cantar un estribillo a los gritos en un boliche lleno" contaba como nivel 1.
 */
export type QuestLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Qué tipo de cosa es la quest. La intensidad la lleva `level`, no la categoría:
 * por eso no hay una categoría 'bold' (era un nivel disfrazado de categoría).
 */
export type QuestCategory =
  | 'presence'
  | 'movement'
  | 'music'
  | 'playful'
  | 'social'
  | 'stranger'
  | 'compliment'
  | 'conversation'
  | 'attraction';

export type Quest = {
  id: number;
  text: string;
  level: QuestLevel;
  category: QuestCategory;
  tags?: string[];
  /** Pisa el emoji de la categoría. Ver CATEGORY_EMOJI en data/quests.ts. */
  emoji?: string;
  /** Segundos de cuenta regresiva. Solo para las excepciones: el resto usa
   *  DEFAULT_QUEST_SECONDS. `null` = sin reloj (ver data/quests.ts). */
  seconds?: number | null;
};

/** Estado de la quest que está en pantalla. */
export type QuestState = 'proposed' | 'accepted';

export type NightFeedback = {
  /** ¿La app te hizo hacer algo que probablemente no habrías hecho? */
  didSomethingNew: boolean | null;
  /** ¿Te ayudó a disfrutar más la noche? */
  enjoyedMore: boolean | null;
  /** ¿Qué momento de la noche querés recordar? */
  momentToRemember: string;
};

export type Session = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  currentQuestId: number | null;
  questState: QuestState;
  /** Cuándo se aceptó la quest actual. La cuenta regresiva se calcula desde acá,
   *  así cerrar Safari y volver no te regala tiempo. */
  acceptedAt: number | null;
  completedQuestIds: number[];
  skippedQuestIds: number[];
  abandonedQuestIds: number[];
  /** "No va": la quest no gustó y no vuelve a salir nunca más. Se guarda aparte de
   *  las salteadas justo para no ensuciar ese dato: saltear es "acá no", esto es
   *  "esta quest está mal". */
  dislikedQuestIds: number[];
  /** Todas las quests mostradas, en orden. La usa el selector para no repetir. */
  shownQuestIds: number[];
  feedback: NightFeedback | null;
};
