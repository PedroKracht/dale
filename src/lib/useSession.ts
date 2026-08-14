import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NightFeedback, Quest, Session } from '../types';
import { QUESTS } from '../data/quests';
import { pickQuest } from './questSelector';
import {
  archiveSession,
  hideQuest,
  loadArchivedSessions,
  loadHiddenQuests,
  resumeActiveSession,
  saveActiveSession,
} from './storage';

/** Estado de la noche: una sola sesión activa por vez, persistida en localStorage. */

type Outcome = 'completed' | 'skipped' | 'abandoned' | 'disliked';

function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolvedIds(session: Session): number[] {
  return [
    ...session.completedQuestIds,
    ...session.skippedQuestIds,
    ...session.abandonedQuestIds,
    ...session.dislikedQuestIds,
  ];
}

/** El mazo sin las quests descartadas con "no va". Si las descartaste todas, vuelve
 *  el mazo entero: mejor repetir que quedarte sin nada en la mano. */
function visibleDeck(hidden: number[]): Quest[] {
  const deck = QUESTS.filter((q) => !hidden.includes(q.id));
  return deck.length > 0 ? deck : QUESTS;
}

/** Pone en pantalla la próxima quest y la registra como mostrada. */
function withNextQuest(session: Session, hidden: number[]): Session {
  const next = pickQuest(
    {
      shownQuestIds: session.shownQuestIds,
      resolvedQuestIds: resolvedIds(session),
    },
    visibleDeck(hidden),
  );

  return {
    ...session,
    currentQuestId: next?.id ?? null,
    questState: 'proposed',
    acceptedAt: null,
    shownQuestIds: next ? [...session.shownQuestIds, next.id] : session.shownQuestIds,
  };
}

function createSession(hidden: number[]): Session {
  return withNextQuest(
    {
      id: newSessionId(),
      startedAt: Date.now(),
      endedAt: null,
      currentQuestId: null,
      questState: 'proposed',
      acceptedAt: null,
      completedQuestIds: [],
      skippedQuestIds: [],
      abandonedQuestIds: [],
      dislikedQuestIds: [],
      shownQuestIds: [],
      feedback: null,
    },
    hidden,
  );
}

/** Registra el resultado de la quest actual y trae otra. */
function resolveCurrent(session: Session, outcome: Outcome, hidden: number[]): Session {
  const id = session.currentQuestId;
  if (id === null) return withNextQuest(session, hidden);

  const next: Session = { ...session };
  if (outcome === 'completed') next.completedQuestIds = [...session.completedQuestIds, id];
  else if (outcome === 'skipped') next.skippedQuestIds = [...session.skippedQuestIds, id];
  else if (outcome === 'abandoned') next.abandonedQuestIds = [...session.abandonedQuestIds, id];
  else next.dislikedQuestIds = [...session.dislikedQuestIds, id];

  return withNextQuest(next, hidden);
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(() => resumeActiveSession());
  const [hidden, setHidden] = useState<number[]>(() => loadHiddenQuests());
  /** Solo para saber si mostrar el acceso al historial en la home. */
  const [archivedCount, setArchivedCount] = useState(() => loadArchivedSessions().length);

  useEffect(() => {
    saveActiveSession(session);
  }, [session]);

  const currentQuest: Quest | null = useMemo(() => {
    if (!session || session.currentQuestId === null) return null;
    return QUESTS.find((q) => q.id === session.currentQuestId) ?? null;
  }, [session]);

  // Si el mazo cambió entre sesiones, la quest guardada puede ya no existir.
  useEffect(() => {
    if (session && !session.endedAt && session.currentQuestId !== null && !currentQuest) {
      setSession(withNextQuest({ ...session, currentQuestId: null }, hidden));
    }
  }, [session, currentQuest, hidden]);

  const startNight = useCallback(() => setSession(createSession(hidden)), [hidden]);

  const acceptQuest = useCallback(() => {
    setSession((s) => (s ? { ...s, questState: 'accepted', acceptedAt: Date.now() } : s));
  }, []);

  const skipQuest = useCallback(() => {
    setSession((s) => (s ? resolveCurrent(s, 'skipped', hidden) : s));
  }, [hidden]);

  const completeQuest = useCallback(() => {
    setSession((s) => (s ? resolveCurrent(s, 'completed', hidden) : s));
  }, [hidden]);

  const abandonQuest = useCallback(() => {
    setSession((s) => (s ? resolveCurrent(s, 'abandoned', hidden) : s));
  }, [hidden]);

  /** "No va": la quest se descarta para siempre, en esta noche y en las que vengan.
   *  Sin confirmación y sin comentarios, igual que todo lo demás. */
  const dislikeQuest = useCallback(() => {
    if (!session || session.currentQuestId === null) return;
    const nextHidden = hideQuest(session.currentQuestId);
    setHidden(nextHidden);
    setSession((s) => (s ? resolveCurrent(s, 'disliked', nextHidden) : s));
  }, [session]);

  /** Cierra la noche y pasa al resumen (la sesión sigue guardada). */
  const finishNight = useCallback(() => {
    setSession((s) => (s ? { ...s, endedAt: Date.now() } : s));
  }, []);

  /** Guarda el feedback, archiva la noche y vuelve al inicio.
   *  El archivado va acá y no adentro del updater: los updaters tienen que ser
   *  puros (React los puede correr dos veces) y si no la noche se guarda duplicada. */
  const closeNight = useCallback(
    (feedback: NightFeedback | null) => {
      if (!session) return;
      archiveSession({ ...session, feedback, endedAt: session.endedAt ?? Date.now() });
      setArchivedCount((n) => n + 1);
      setSession(null);
    },
    [session],
  );

  return {
    session,
    currentQuest,
    archivedCount,
    startNight,
    acceptQuest,
    skipQuest,
    dislikeQuest,
    completeQuest,
    abandonQuest,
    finishNight,
    closeNight,
  };
}
