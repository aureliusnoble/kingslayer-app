import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';

export default function JoinGameScreen() {
  const navigate = useNavigate();
  const { loading, error, roomCode: storeRoomCode, gameState } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCodeChange = (value: string) => {
    // Only allow alphanumeric characters and limit to 6 characters
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setRoomCode(cleanValue);
  };

  const handleJoinGame = () => {
    if (roomCode.length !== 6 || !playerName.trim()) return;
    
    socketService.joinGame(roomCode, playerName.trim());
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    handleCodeChange(pastedText);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && roomCode.length === 6 && playerName.trim()) {
      handleJoinGame();
    }
  };

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
          <input
            type="text"
            value={roomCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            onPaste={handlePaste}
            onKeyPress={handleKeyPress}
            placeholder="ABCD12"
            className="input-field text-center text-2xl font-mono tracking-widest uppercase placeholder:text-base placeholder:text-neutral-medium"
            maxLength={6}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <p className="text-xs text-neutral-medium mt-1 text-center">
            You can type or paste the room code
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            <div className="flex items-start gap-2">
              <span className="text-red-500">⚠️</span>
              <div>
                <p className="font-medium">{error}</p>
                {error.includes('name is already taken') && (
                  <p className="text-xs mt-1 text-red-600">
                    Try adding a number or changing your name slightly.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={handleJoinGame}
          disabled={loading || roomCode.length !== 6 || !playerName.trim()}
        >
          {loading ? 'Joining...' : 'JOIN ROOM'}
        </Button>
      </div>
    </div>
  );
}