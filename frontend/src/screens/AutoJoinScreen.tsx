import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import MedievalBackground from '../components/common/MedievalBackground';
import MedievalInput from '../components/common/MedievalInput';
import { ChevronLeft, Users, AlertTriangle } from 'lucide-react';

export default function AutoJoinScreen() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { loading, error, roomCode: storeRoomCode, gameState, setError } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Navigate to lobby when game is joined successfully
  useEffect(() => {
    if (storeRoomCode && gameState && gameState.phase === 'lobby' && !loading) {
      navigate('/lobby');
    }
  }, [storeRoomCode, gameState, loading, navigate]);

  // Reset joining state when there's an error
  useEffect(() => {
    if (error && isJoining) {
      setIsJoining(false);
    }
  }, [error, isJoining]);

  // Validate room code format
  const isValidRoomCode = roomCode && roomCode.length === 6 && /^[A-Z0-9]+$/.test(roomCode);

  const handleJoinGame = () => {
    if (!roomCode || !playerName.trim() || !isValidRoomCode) return;
    
    setIsJoining(true);
    socketService.joinGame(roomCode.toUpperCase(), playerName.trim());
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    // Clear any existing error when user starts typing a new name
    if (error) {
      setError(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && playerName.trim() && isValidRoomCode) {
      handleJoinGame();
    }
  };

  if (!isValidRoomCode) {
    return (
      <MedievalBackground variant="battlements">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle size={64} className="text-red-highlight" />
            </div>
            <h1 className="text-2xl font-bold text-white font-display">
              INVALID ROOM CODE
            </h1>
            <p className="text-medieval-stone-light">
              The room code "{roomCode}" is not valid. Room codes must be 6 characters long.
            </p>
            <Button
              variant="medieval-stone"
              fullWidth
              onClick={() => navigate('/')}
              className="text-lg font-bold bg-medieval-stone-medium bg-opacity-90 border-2 border-medieval-stone-light shadow-lg"
            >
              <ChevronLeft size={16} className="mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </MedievalBackground>
    );
  }

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
            JOIN ROOM
          </h1>
          <div className="w-16" />
        </div>

        <div className="flex-1 max-w-sm mx-auto w-full space-y-6">
          {/* Room Code Display */}
          <div className="bg-surface-medium rounded-lg p-4 border-2 border-medieval-metal-gold text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users size={24} className="text-medieval-metal-gold" />
              <h2 className="text-lg font-bold text-white">Joining Room:</h2>
            </div>
            <div className="font-mono text-2xl font-bold text-medieval-metal-gold tracking-wider">
              {roomCode}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-lg font-semibold text-medieval-metal-gold drop-shadow-md">
              Your Name:
            </label>
            <MedievalInput
              variant="parchment"
              value={playerName}
              onChange={handleNameChange}
              onKeyPress={handleKeyPress}
              maxLength={20}
              placeholder="Enter your name"
              autoFocus
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-primary bg-opacity-20 text-red-highlight rounded-lg text-sm border border-red-primary">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-highlight mt-0.5" />
                <div>
                  <p className="font-medium">{error}</p>
                  {error.includes('name is already taken') && (
                    <p className="text-xs mt-1 text-red-highlight opacity-80">
                      Try adding a number or changing your name slightly.
                    </p>
                  )}
                  {error.includes('Room not found') && (
                    <p className="text-xs mt-1 text-red-highlight opacity-80">
                      This room may have ended or the code may be incorrect.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Join Button */}
          <Button
            variant="medieval-blue"
            size="large"
            fullWidth
            onClick={handleJoinGame}
            disabled={loading || isJoining || !playerName.trim()}
            className="text-lg font-bold bg-blue-primary bg-opacity-90 border-2 border-blue-primary shadow-lg"
          >
            {loading || isJoining ? 'Joining...' : 'JOIN ROOM'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-medieval-stone-light">
              You'll be automatically connected to the game lobby once you join.
            </p>
          </div>
        </div>
      </div>
    </MedievalBackground>
  );
}