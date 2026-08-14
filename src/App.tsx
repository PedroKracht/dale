import { useState } from 'react';
import type { Player } from './types';
import { loadPlayer, savePlayer } from './lib/storage';
import { History } from './components/History';
import { Home } from './components/Home';
import { QuestScreen } from './components/QuestScreen';
import { Summary } from './components/Summary';
import { useSession } from './lib/useSession';

/**
 * Cuatro pantallas, sin router: la sesión guardada define dónde estás.
 * sin sesión -> home · sesión abierta -> quest · sesión cerrada -> resumen.
 * El historial es lo único que se abre a mano, desde la home.
 */
export default function App() {
  const {
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
  } = useSession();

  const [showHistory, setShowHistory] = useState(false);
  /** `null` = nunca se preguntó el nombre. Se pregunta una vez y no vuelve. */
  const [player, setPlayer] = useState<Player | null>(() => loadPlayer());

  function handleStart(name: string | null) {
    if (player === null) {
      const nuevo = { name: (name ?? '').trim() };
      savePlayer(nuevo);
      setPlayer(nuevo);
    }
    startNight();
  }

  if (!session) {
    if (showHistory) return <History onBack={() => setShowHistory(false)} />;
    return (
      <Home
        askName={player === null}
        onStart={handleStart}
        hasHistory={archivedCount > 0}
        onOpenHistory={() => setShowHistory(true)}
      />
    );
  }

  if (session.endedAt !== null) {
    return <Summary session={session} onClose={closeNight} />;
  }

  return (
    <QuestScreen
      quest={currentQuest}
      questState={session.questState}
      acceptedAt={session.acceptedAt}
      onAccept={acceptQuest}
      onSkip={skipQuest}
      onDislike={dislikeQuest}
      onComplete={completeQuest}
      onAbandon={abandonQuest}
      onFinishNight={finishNight}
    />
  );
}
