import { useState } from 'react';
import type { NightFeedback, Session } from '../types';

type Props = {
  session: Session;
  onClose: (feedback: NightFeedback) => void;
};

type YesNoProps = {
  question: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
};

function YesNo({ question, value, onChange }: YesNoProps) {
  return (
    <div className="question">
      <p className="question__text">{question}</p>
      <div className="chips">
        <button
          className="chip"
          aria-pressed={value === true}
          onClick={() => onChange(value === true ? null : true)}
        >
          Sí
        </button>
        <button
          className="chip"
          aria-pressed={value === false}
          onClick={() => onChange(value === false ? null : false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

export function Summary({ session, onClose }: Props) {
  const [didSomethingNew, setDidSomethingNew] = useState<boolean | null>(null);
  const [enjoyedMore, setEnjoyedMore] = useState<boolean | null>(null);
  const [momentToRemember, setMomentToRemember] = useState('');

  return (
    <div className="screen screen--scroll">
      <div className="summary">
        <div>
          <h2 className="summary__title">La noche</h2>
          <div className="counts">
            <div>
              <div className="count__value">{session.completedQuestIds.length}</div>
              <div className="count__label">Completadas</div>
            </div>
            <div>
              <div className="count__value">{session.skippedQuestIds.length}</div>
              <div className="count__label">Salteadas</div>
            </div>
          </div>
        </div>

        <YesNo
          question="¿La app te hizo hacer algo que probablemente no habrías hecho?"
          value={didSomethingNew}
          onChange={setDidSomethingNew}
        />

        <YesNo
          question="¿Te ayudó a disfrutar más la noche?"
          value={enjoyedMore}
          onChange={setEnjoyedMore}
        />

        <div className="question">
          <label className="question__text" htmlFor="moment">
            ¿Qué momento de la noche querés recordar?
          </label>
          <textarea
            id="moment"
            className="field"
            value={momentToRemember}
            onChange={(e) => setMomentToRemember(e.target.value)}
            placeholder="Opcional"
            rows={3}
          />
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn--primary"
          onClick={() => onClose({ didSomethingNew, enjoyedMore, momentToRemember: momentToRemember.trim() })}
        >
          Cerrar la noche
        </button>
      </div>
    </div>
  );
}
