import type { Player, Session } from '../types';

/**
 * Persistencia. Todo local, nada de red.
 * localStorage puede fallar (Safari en modo privado, cuota llena): si falla,
 * la app sigue funcionando en memoria y se pierde solo la recuperación.
 */

const ACTIVE_KEY = 'dale.active-session.v1';
const ARCHIVE_KEY = 'dale.sessions.v1';
/** Quests descartadas con "no va". Sobreviven a la noche: el mazo se hace personal. */
const HIDDEN_KEY = 'dale.hidden-quests.v1';
/** Quién usa este teléfono. Que la clave exista significa que ya se preguntó. */
const PLAYER_KEY = 'dale.player.v1';

/** Se llamó Bolichap y después Arranque. Lo guardado con esos nombres se muda solo. */
const LEGACY_KEYS: Record<string, string> = {
  'arranque.active-session.v1': ACTIVE_KEY,
  'arranque.sessions.v1': ARCHIVE_KEY,
  'bolichap.active-session.v1': ACTIVE_KEY,
  'bolichap.sessions.v1': ARCHIVE_KEY,
};

function migrateLegacyKeys(): void {
  try {
    for (const [from, to] of Object.entries(LEGACY_KEYS)) {
      const value = localStorage.getItem(from);
      if (value !== null && localStorage.getItem(to) === null) localStorage.setItem(to, value);
      if (value !== null) localStorage.removeItem(from);
    }
  } catch {
    /* sin persistencia no hay nada que mudar */
  }
}

migrateLegacyKeys();

/** Después de esto, una noche abierta se considera olvidada y se archiva sola. */
const MAX_ACTIVE_AGE_MS = 12 * 60 * 60 * 1000;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin persistencia, la noche sigue igual */
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* idem */
  }
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Partial<Session>;
  return (
    typeof s.id === 'string' &&
    typeof s.startedAt === 'number' &&
    Array.isArray(s.completedQuestIds) &&
    Array.isArray(s.skippedQuestIds) &&
    Array.isArray(s.abandonedQuestIds) &&
    Array.isArray(s.shownQuestIds)
  );
}

export function loadArchivedSessions(): Session[] {
  const value = read<unknown>(ARCHIVE_KEY);
  return Array.isArray(value) ? value.filter(isSession) : [];
}

export function archiveSession(session: Session): void {
  const all = loadArchivedSessions();
  all.push({ ...session, endedAt: session.endedAt ?? Date.now() });
  write(ARCHIVE_KEY, all);
}

/** `null` = todavía no se preguntó. Un nombre vacío es una respuesta válida:
 *  significa que se preguntó y no quiso poner nada. */
export function loadPlayer(): Player | null {
  const value = read<unknown>(PLAYER_KEY);
  if (typeof value !== 'object' || value === null) return null;
  const name = (value as Partial<Player>).name;
  return { name: typeof name === 'string' ? name : '' };
}

export function savePlayer(player: Player): void {
  write(PLAYER_KEY, { name: player.name.trim().slice(0, 24) });
}

export function loadHiddenQuests(): number[] {
  const value = read<unknown>(HIDDEN_KEY);
  return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : [];
}

/** Devuelve la lista actualizada. Para volver a ver todo: borrar la clave. */
export function hideQuest(id: number): number[] {
  const hidden = loadHiddenQuests();
  if (hidden.includes(id)) return hidden;
  const next = [...hidden, id];
  write(HIDDEN_KEY, next);
  return next;
}

export function saveActiveSession(session: Session | null): void {
  if (session) write(ACTIVE_KEY, session);
  else remove(ACTIVE_KEY);
}

/**
 * Recupera la noche en curso al abrir la app: cerrar Safari de golpe no la rompe.
 * Si quedó abierta hace demasiado (te fuiste a dormir sin terminarla), se archiva
 * en silencio y se arranca de cero.
 */
export function resumeActiveSession(): Session | null {
  const session = read<unknown>(ACTIVE_KEY);
  if (!isSession(session)) {
    remove(ACTIVE_KEY);
    return null;
  }

  if (Date.now() - session.startedAt > MAX_ACTIVE_AGE_MS) {
    archiveSession(session);
    remove(ACTIVE_KEY);
    return null;
  }

  // Campos agregados después: una noche guardada con una versión vieja no los trae.
  return {
    ...session,
    acceptedAt: session.acceptedAt ?? null,
    dislikedQuestIds: session.dislikedQuestIds ?? [],
    outcomes: session.outcomes ?? [],
  };
}
