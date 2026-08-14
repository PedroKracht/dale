import { Home } from './components/Home';
import { QuestScreen } from './components/QuestScreen';
import { Summary } from './components/Summary';
import { useSession } from './lib/useSession';

/**
 * Tres pantallas, sin router: la sesión guardada define dónde estás.
 * sin sesión -> home · sesión abierta -> quest · sesión cerrada -> resumen.
 */
export default function App() {
  const {
    session,
    currentQuest,
    startNight,
    acceptQuest,
    skipQuest,
    dislikeQuest,
    completeQuest,
    abandonQuest,
    finishNight,
    closeNight,
  } = useSession();

  if (!session) return <Home onStart={startNight} />;

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
