import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import MedievalBackground from '../components/common/MedievalBackground';
import MedievalInput from '../components/common/MedievalInput';
import CodeInput, { CodeInputRef } from '../components/common/CodeInput';
import { ChevronLeft, DoorOpen, ClipboardCheck, AlertTriangle } from 'lucide-react';

export default function JoinGameScreen() {
  const navigate = useNavigate();
  const { loading, error, roomCode: storeRoomCode, gameState } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const codeInputRef = useRef<CodeInputRef>(null);

  const handleCodeChange = (value: string) => {
    setRoomCode(value); // CodeInput component handles validation
  };

  const handleJoinGame = () => {
    if (roomCode.length !== 6 || !playerName.trim()) return;
    
    socketService.joinGame(roomCode, playerName.trim());
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleJoinGame();
  };


  // Navigate to appropriate screen when game is joined successfully
  useEffect(() => {
    if (storeRoomCode && gameState && !loading) {
      const myPlayer = gameState.players[useGameStore.getState().playerId || ''];
      
      switch (gameState.phase) {
        case 'lobby':
          navigate('/lobby');
          break;
        case 'setup':
          // Check if player has already seen their role
          if (myPlayer?.isRoleReady) {
            navigate('/game'); // Skip role reveal if already seen
          } else {
            navigate('/role-reveal');
          }
          break;
        case 'playing':
          navigate('/game');
          break;
        case 'ended':
          navigate('/end');
          break;
        default:
          navigate('/lobby');
      }
    }
  }, [storeRoomCode, gameState, loading, navigate]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleCodeChange(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const focusCodeInput = () => {
    codeInputRef.current?.focus();
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
            JOIN GAME
          </h1>
          <div className="w-16" />
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 max-w-sm mx-auto w-full space-y-6">
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
              inputMode="text"
            />
          </div>

          {/* Room Code Input */}
          <div className="space-y-4">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={focusCodeInput}
            >
              <DoorOpen size={24} className="text-medieval-metal-gold" />
              <label className="text-lg font-semibold text-medieval-metal-gold drop-shadow-md cursor-pointer">Room Code:</label>
            </div>
            
            <div tabIndex={-1} onClick={focusCodeInput}>
              <CodeInput
                ref={codeInputRef}
                value={roomCode}
                onChange={handleCodeChange}
                autoFocus={false}
                className="mb-4"
              />
            </div>

            {/* Paste Button */}
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-medieval-stone-light hover:text-medieval-metal-gold transition-colors font-medium"
            >
              <ClipboardCheck size={16} />
              <span>Paste Code</span>
            </button>
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
                </div>
              </div>
            </div>
          )}

          {/* Join Button */}
          <Button
            type="submit"
            variant="medieval-blue"
            size="large"
            fullWidth
            disabled={loading || roomCode.length !== 6 || !playerName.trim()}
            className="text-lg font-bold bg-blue-primary bg-opacity-90 border-2 border-blue-primary shadow-lg"
          >
            {loading ? 'Joining...' : 'JOIN ROOM'}
          </Button>
        </form>
      </div>
    </MedievalBackground>
  );
}