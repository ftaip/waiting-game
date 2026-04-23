import React, { useState, useCallback } from 'react';
import { WaitingGame, type SkinId, type AchievementId, SKIN_IDS } from 'react-waiting-game';

export function App() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [skin, setSkin] = useState<SkinId>('jellyfish');
  const [unlocked, setUnlocked] = useState<AchievementId[]>([]);
  const [combo, setCombo] = useState(1);
  const [pearls, setPearls] = useState(0);

  const simulateLLM = useCallback(() => {
    setLoading(true);
    setResponse(null);
    setCombo(1);
    setPearls(0);
    const delay = 8000 + Math.random() * 8000;
    setTimeout(() => {
      setLoading(false);
      setResponse(
        `Done! The LLM took ${(delay / 1000).toFixed(1)}s. Pearls: ${pearls}. Best combo: x${combo}.`,
      );
    }, delay);
  }, [combo, pearls]);

  return (
    <div style={{ textAlign: 'center', maxWidth: 720, padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>react-waiting-game</h1>
      <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
        Hold space to swim. Collect pearls, time near-misses, grab power-ups.
      </p>

      <div style={{ marginBottom: 16, fontSize: 13 }}>
        Skin:{' '}
        {SKIN_IDS.map((id) => (
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
          <WaitingGame
            autoStart
            skin={skin}
            persistHighScore
            persistAchievements
            onComboChange={(_c, m) => setCombo((prev) => Math.max(prev, m))}
            onPearlCollect={(total) => setPearls(total)}
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
