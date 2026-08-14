type Props = {
  onStart: () => void;
};

export function Home({ onStart }: Props) {
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
        <button className="btn btn--primary" onClick={onStart}>
          Empezar noche
        </button>
      </div>
    </div>
  );
}
