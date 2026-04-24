import React, { useState, useCallback, useMemo } from 'react';
import {
  WaitingArcade,
  GAMES,
  GAME_IDS,
  type GameId,
} from 'react-waiting-game';

export function App() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [game, setGame] = useState<GameId>('jellyfish');
  const [skin, setSkin] = useState<string>(GAMES.jellyfish.defaultSkin);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [combo, setCombo] = useState(1);
  const [pickups, setPickups] = useState(0);

  const skinIds = useMemo(() => GAMES[game].skins, [game]);

  const onSwitchGame = (id: GameId) => {
    setGame(id);
    setSkin(GAMES[id].defaultSkin);
    setUnlocked([]);
    setCombo(1);
    setPickups(0);
  };

  const simulateLLM = useCallback(() => {
    setLoading(true);
    setResponse(null);
    setCombo(1);
    setPickups(0);
    const delay = 8000 + Math.random() * 8000;
    setTimeout(() => {
      setLoading(false);
      setResponse(
        `Done! The LLM took ${(delay / 1000).toFixed(1)}s. Pickups: ${pickups}. Best combo: x${combo}.`,
      );
    }, delay);
  }, [combo, pickups]);

  return (
    <div style={{ textAlign: 'center', maxWidth: 720, padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>react-waiting-game</h1>
      <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
        A tiny one-button arcade for filling the wait. Pick a game, pick a skin,
        then ask the (fake) LLM.
      </p>

      <div style={{ marginBottom: 12, fontSize: 13 }}>
        Game:{' '}
        {GAME_IDS.map((id) => (
          <button
            key={id}
            onClick={() => onSwitchGame(id)}
            style={{
              marginLeft: 6,
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid #ccc',
              background: game === id ? '#333' : '#fff',
              color: game === id ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            {id}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16, fontSize: 13 }}>
        Skin:{' '}
        {skinIds.map((id) => (
          <button
            key={id}
            onClick={() => setSkin(id)}
            style={{
              marginLeft: 6,
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid #ccc',
              background: skin === id ? '#333' : '#fff',
              color: skin === id ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            {id}
          </button>
        ))}
      </div>

      <button
        onClick={simulateLLM}
        disabled={loading}
        style={{
          padding: '8px 20px',
          fontSize: 14,
          borderRadius: 6,
          border: '1px solid #ccc',
          background: loading ? '#eee' : '#fff',
          cursor: loading ? 'default' : 'pointer',
          marginBottom: 16,
        }}
      >
        {loading ? 'Thinking...' : 'Ask the LLM'}
      </button>

      {loading && (
        <div style={{ marginBottom: 16, color: '#333' }}>
          <WaitingArcade
            game={game}
            skin={skin}
            autoStart
            persistHighScore
            persistAchievements
            onComboChange={(_c, m) => setCombo((prev) => Math.max(prev, m))}
            onPickup={(total) => setPickups(total)}
            onAchievement={(id) =>
              setUnlocked((prev) => (prev.includes(id) ? prev : [...prev, id]))
            }
          />
        </div>
      )}

      {response && (
        <p style={{ color: '#2a7', fontFamily: 'monospace', fontSize: 13 }}>{response}</p>
      )}

      {unlocked.length > 0 && (
        <p style={{ color: '#666', fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}>
          Achievements this session: {unlocked.join(', ')}
        </p>
      )}
    </div>
  );
}
