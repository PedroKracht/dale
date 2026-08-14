import { useEffect, useState } from 'react';

/**
 * Cuenta regresiva de la quest aceptada.
 *
 * Se calcula siempre contra el reloj real (`startedAt`), nunca restando de a uno:
 * si cerrás Safari en medio de una quest y volvés dos minutos después, el tiempo
 * corrió igual. Tampoco importa que iOS congele los timers en segundo plano.
 */

export type Countdown = {
  /** Segundos que faltan. Nunca baja de 0. */
  secondsLeft: number;
  /** 0 al empezar, 1 al llegar a cero. Para la barra. */
  progress: number;
  expired: boolean;
};

function compute(startedAt: number, total: number): Countdown {
  const elapsed = (Date.now() - startedAt) / 1000;
  const secondsLeft = Math.max(0, Math.ceil(total - elapsed));
  return {
    secondsLeft,
    progress: Math.min(1, Math.max(0, elapsed / total)),
    expired: secondsLeft === 0,
  };
}

export function useCountdown(startedAt: number | null, total: number): Countdown | null {
  const [state, setState] = useState<Countdown | null>(() =>
    startedAt === null ? null : compute(startedAt, total),
  );

  useEffect(() => {
    if (startedAt === null) {
      setState(null);
      return;
    }

    setState(compute(startedAt, total));

    // Cada 250ms para que el número cambie cuando tiene que cambiar y no hasta
    // un segundo después.
    const id = window.setInterval(() => {
      const next = compute(startedAt, total);
      setState(next);
      if (next.expired) window.clearInterval(id);
    }, 250);

    return () => window.clearInterval(id);
  }, [startedAt, total]);

  return state;
}

/** 120 -> "2:00" */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
