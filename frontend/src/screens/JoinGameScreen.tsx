import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import clsx from 'clsx';

export default function JoinGameScreen() {
  const navigate = useNavigate();
  const { loading, error, roomCode: storeRoomCode, gameState } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[A-Z0-9]?$/i.test(value)) return;

    const newCode = [...roomCode];
    newCode[index] = value.toUpperCase();
    setRoomCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6 && playerName.trim()) {
        handleJoinGame(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !roomCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleJoinGame = (code?: string) => {
    const finalCode = code || roomCode.join('');
    if (finalCode.length !== 6 || !playerName.trim()) return;
    
    socketService.joinGame(finalCode, playerName.trim());
  };

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Navigate to lobby when game is joined successfully
  useEffect(() => {
    if (storeRoomCode && gameState && gameState.phase === 'lobby' && !loading) {
      navigate('/lobby');
    }
  }, [storeRoomCode, gameState, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom">
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-neutral-dark"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold flex-1 text-center">JOIN GAME</h1>
        <div className="w-12" />
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
          <label className="block text-sm font-medium mb-2">Room Code:</label>
          <div className="flex gap-2 justify-center mb-4">
            {roomCode.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="code-input"
                maxLength={1}
              />
            ))}
          </div>
          
          {/* Custom keyboard */}
          <div className="grid grid-cols-6 gap-2">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((char) => (
              <button
                key={char}
                onClick={() => {
                  const emptyIndex = roomCode.findIndex(c => c === '');
                  if (emptyIndex !== -1) {
                    handleCodeChange(emptyIndex, char);
                  }
                }}
                className={clsx(
                  'py-2 rounded font-semibold text-sm',
                  'bg-neutral-light border border-neutral-medium',
                  'active:bg-neutral-medium transition-colors'
                )}
              >
                {char}
              </button>
            ))}
          </div>
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
          onClick={() => handleJoinGame()}
          disabled={loading || roomCode.join('').length !== 6 || !playerName.trim()}
        >
          {loading ? 'Joining...' : 'JOIN ROOM'}
        </Button>
      </div>
    </div>
  );
}