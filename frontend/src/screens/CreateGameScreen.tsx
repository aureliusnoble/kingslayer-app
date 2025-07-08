import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import clsx from 'clsx';

export default function CreateGameScreen() {
  const navigate = useNavigate();
  const { loading, error, roomCode, gameState } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [playerCount, setPlayerCount] = useState(6);

  // Navigate to lobby when game is created successfully
  useEffect(() => {
    if (roomCode && gameState && gameState.phase === 'lobby' && !loading) {
      navigate('/lobby');
    }
  }, [roomCode, gameState, loading, navigate]);

  const handleCreateGame = () => {
    if (playerName.trim().length === 0) return;
    socketService.createGame(playerName.trim(), playerCount);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom">
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-neutral-dark"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold flex-1 text-center">CREATE GAME</h1>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 max-w-sm mx-auto w-full space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Your Name:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            placeholder="Enter your name"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Player Count:</label>
          <div className="grid grid-cols-4 gap-2">
            {[6, 8, 10, 12].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={clsx(
                  'py-3 rounded-lg font-semibold transition-colors',
                  playerCount === count
                    ? 'bg-neutral-dark text-white'
                    : 'bg-neutral-light border-2 border-neutral-medium'
                )}
              >
                {count}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPlayerCount(14)}
            className={clsx(
              'mt-2 py-3 w-24 rounded-lg font-semibold transition-colors',
              playerCount === 14
                ? 'bg-neutral-dark text-white'
                : 'bg-neutral-light border-2 border-neutral-medium'
            )}
          >
            14
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={handleCreateGame}
          disabled={loading || playerName.trim().length === 0}
        >
          {loading ? 'Creating...' : 'CREATE ROOM'}
        </Button>
      </div>
    </div>
  );
}