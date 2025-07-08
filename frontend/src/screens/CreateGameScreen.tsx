import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import clsx from 'clsx';
import MedievalBackground from '../components/common/MedievalBackground';
import MedievalInput from '../components/common/MedievalInput';
import { ChevronLeft, Users } from 'lucide-react';

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
    <MedievalBackground variant="battlements">
      <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-medieval-metal-gold transition-colors"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold flex-1 text-center text-white font-display">
            CREATE GAME
          </h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 max-w-sm mx-auto w-full space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-lg font-semibold text-medieval-metal-gold drop-shadow-md">
              Your Name:
            </label>
            <MedievalInput
              variant="parchment"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              placeholder="Enter your name"
            />
          </div>

          {/* Player Count Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users size={24} className="text-medieval-metal-gold" />
              <label className="text-lg font-semibold text-medieval-metal-gold drop-shadow-md">Player Count:</label>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[6, 8, 10, 12].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={clsx(
                    'py-3 rounded-lg font-semibold transition-all duration-200 border-2',
                    'hover:scale-105 transform',
                    playerCount === count
                      ? 'bg-medieval-metal-gold text-surface-dark border-medieval-metal-gold shadow-lg'
                      : 'bg-surface-medium text-white border-medieval-stone-light hover:border-medieval-metal-gold'
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setPlayerCount(14)}
              className={clsx(
                'py-3 w-24 rounded-lg font-semibold transition-all duration-200 border-2',
                'hover:scale-105 transform',
                playerCount === 14
                  ? 'bg-medieval-metal-gold text-surface-dark border-medieval-metal-gold shadow-lg'
                  : 'bg-surface-medium text-white border-medieval-stone-light hover:border-medieval-metal-gold'
              )}
            >
              14
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-primary bg-opacity-20 text-red-highlight rounded-lg text-sm border border-red-primary">
              {error}
            </div>
          )}

          {/* Create Button */}
          <div className="pt-4">
            <Button
              variant="medieval-gold"
              size="large"
              fullWidth
              onClick={handleCreateGame}
              disabled={loading || playerName.trim().length === 0}
              className="text-lg font-bold bg-medieval-metal-gold bg-opacity-90 border-2 border-medieval-metal-gold shadow-lg"
            >
              {loading ? 'Creating...' : 'CREATE ROOM'}
            </Button>
          </div>
        </div>
      </div>
    </MedievalBackground>
  );
}