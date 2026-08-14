import { useState } from 'react';

type Props = {
  /** Solo la primerísima vez. Después la home vuelve a estar limpia para siempre. */
  askName: boolean;
  onStart: (name: string | null) => void;
  hasHistory: boolean;
  onOpenHistory: () => void;
};

export function Home({ askName, onStart, hasHistory, onOpenHistory }: Props) {
  const [name, setName] = useState('');

  return (
    <div className="screen">
      <div className="topbar" />

      <div className="stage">
        <div>
          <h1 className="wordmark">
            DALE<span className="wordmark__bang">!</span>
          </h1>
          <p className="tagline">Quests</p>
        </div>
      </div>

      <div className="actions">
        {/* No bloquea nada: si arrancás sin escribir, no vuelve a preguntar. */}
        {askName && (
          <label className="who">
            <span className="who__label">¿Cómo te llamás?</span>
            <input
              className="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Opcional"
              autoCapitalize="words"
              autoComplete="given-name"
              maxLength={24}
              enterKeyHint="go"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                  onStart(name);
                }
              }}
            />
          </label>
        )}

        <button className="btn btn--primary" onClick={() => onStart(askName ? name : null)}>
          Empezar noche
        </button>

        {hasHistory && (
          <button className="btn btn--quiet btn--centered" onClick={onOpenHistory}>
            Noches anteriores
          </button>
        )}
      </div>
    </div>
  );
}
