import { useMemo, useState } from 'react';
import type { Session } from '../types';
import { QUESTS, questEmoji } from '../data/quests';
import { loadArchivedSessions } from '../lib/storage';

/**
 * Las noches que ya pasaron.
 *
 * No es un dashboard: no hay porcentajes, ni rachas, ni promedios, ni gráficos.
 * Cada noche es una tira de emojis de lo que hiciste, en orden. Lo que salteaste
 * y lo que descartaste sigue guardado, pero no se muestra: mirar para atrás no
 * tiene que sentirse como un boletín.
 */

type Props = {
  onBack: () => void;
};

/** "sáb 13 ago · 02:14" — 24 horas, que es como se lee la hora acá. */
function formatNight(startedAt: number): string {
  const d = new Date(startedAt);
  const fecha = d
    .toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/,/g, '');
  const hora = d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${fecha} · ${hora}`;
}

/** Los emojis de lo completado. Las quests borradas del mazo no rompen nada. */
function strip(session: Session): string[] {
  return session.completedQuestIds
    .map((id) => QUESTS.find((q) => q.id === id))
    .filter((q): q is (typeof QUESTS)[number] => q !== undefined)
    .map(questEmoji);
}

function Night({ session }: { session: Session }) {
  const emojis = strip(session);
  const hechas = session.completedQuestIds.length;
  const momento = session.feedback?.momentToRemember?.trim();

  return (
    <div className="night">
      <div className="night__date">{formatNight(session.startedAt)}</div>

      {emojis.length > 0 ? (
        <div className="night__strip" aria-hidden="true">
          {emojis.map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
      ) : (
        <div className="night__empty">Ninguna quest completada.</div>
      )}

      <div className="night__count">
        {hechas === 1 ? '1 completada' : `${hechas} completadas`}
      </div>

      {momento && <p className="night__moment">{momento}</p>}
    </div>
  );
}

export function History({ onBack }: Props) {
  // Más recientes arriba.
  const nights = useMemo(() => [...loadArchivedSessions()].reverse(), []);
  const [exportado, setExportado] = useState<'copiado' | 'bajado' | null>(null);

  /** Saca los datos crudos de la app. Safari niega el portapapeles cuando el
   *  documento no tiene foco, así que si falla se baja un archivo: siempre
   *  tiene que pasar algo visible al tocar. */
  async function exportarDatos() {
    const json = JSON.stringify(nights, null, 2);
    let resultado: 'copiado' | 'bajado' = 'copiado';

    try {
      await navigator.clipboard.writeText(json);
    } catch {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `dale-noches-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      resultado = 'bajado';
    }

    setExportado(resultado);
    window.setTimeout(() => setExportado(null), 2200);
  }

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <button className="btn btn--quiet" onClick={onBack}>
          Volver
        </button>
        {nights.length > 0 && (
          <button className="btn btn--quiet" onClick={exportarDatos}>
            {exportado === 'copiado' ? 'Copiado' : exportado === 'bajado' ? 'Bajado' : 'Copiar datos'}
          </button>
        )}
      </div>

      <div className="history">
        <h2 className="summary__title">
          {nights.length === 1 ? '1 noche' : `${nights.length} noches`}
        </h2>

        {nights.length === 0 ? (
          <p className="empty">Todavía no terminaste ninguna noche.</p>
        ) : (
          nights.map((night) => <Night key={night.id + night.startedAt} session={night} />)
        )}
      </div>
    </div>
  );
}
