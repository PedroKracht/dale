import { useEffect, useRef, useState } from 'react';
import type { Quest, QuestState } from '../types';
import { questEmoji, questSeconds } from '../data/quests';
import { formatCountdown, useCountdown } from '../lib/useCountdown';

/** Duración de la confirmación al tocar HECHO. Corta a propósito. */
const FLASH_MS = 620;

type Props = {
  quest: Quest | null;
  questState: QuestState;
  acceptedAt: number | null;
  onAccept: () => void;
  onSkip: () => void;
  onDislike: () => void;
  onComplete: () => void;
  onAbandon: () => void;
  onFinishNight: () => void;
};

export function QuestScreen({
  quest,
  questState,
  acceptedAt,
  onAccept,
  onSkip,
  onDislike,
  onComplete,
  onAbandon,
  onFinishNight,
}: Props) {
  const [flashing, setFlashing] = useState(false);
  const timer = useRef<number | null>(null);

  const accepted = questState === 'accepted';
  // Las quests dirigidas a una persona puntual devuelven null: van sin reloj.
  const total = quest ? questSeconds(quest) : null;
  const countdown = useCountdown(accepted && total !== null ? acceptedAt : null, total ?? 0);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  function handleComplete() {
    if (flashing) return;
    setFlashing(true);
    timer.current = window.setTimeout(() => {
      setFlashing(false);
      onComplete();
    }, FLASH_MS);
  }

  return (
    <div className="screen">
      {/* La barra drena en el borde de arriba: se lee de reojo, sin enfocar. */}
      {countdown && !countdown.expired && (
        <div className="drain" style={{ transform: `scaleX(${1 - countdown.progress})` }} />
      )}

      <div className="topbar">
        {/* Descarta la quest para siempre. Distinto de SIGUIENTE, que es solo "acá no". */}
        {quest ? (
          <button className="btn btn--quiet" onClick={onDislike} disabled={flashing}>
            No va
          </button>
        ) : (
          <span />
        )}
        <button className="btn btn--quiet" onClick={onFinishNight}>
          Terminar noche
        </button>
      </div>

      {/* Emoji, quest y reloj en la misma columna: todo entra en una sola mirada. */}
      <div className="stage">
        {quest ? (
          <>
            <div key={`emoji-${quest.id}`} className="quest__emoji" aria-hidden="true">
              {questEmoji(quest)}
            </div>
            <p
              key={`${quest.id}-${questState}`}
              className={accepted ? 'quest quest--accepted' : 'quest'}
              aria-live="polite"
            >
              {quest.text}
            </p>
            {countdown && (
              <div className={countdown.expired ? 'timer timer--expired' : 'timer'}>
                {formatCountdown(countdown.secondsLeft)}
              </div>
            )}
          </>
        ) : (
          <p className="empty">No hay más quests por ahora.</p>
        )}
      </div>

      <div className="actions">
        {quest && !accepted && (
          <>
            <button className="btn btn--primary" onClick={onAccept}>
              Aceptar
            </button>
            <button className="btn btn--ghost" onClick={onSkip}>
              Siguiente
            </button>
          </>
        )}

        {/* Llegar a cero no deshabilita nada: HECHO sigue disponible para siempre. */}
        {quest && accepted && (
          <>
            <button className="btn btn--primary" onClick={handleComplete} disabled={flashing}>
              Hecho
            </button>
            <button className="btn btn--ghost" onClick={onAbandon} disabled={flashing}>
              Abandonar
            </button>
          </>
        )}
      </div>

      {flashing && (
        <div className="flash" aria-hidden="true">
          <div className="flash__ring" />
        </div>
      )}
    </div>
  );
}
