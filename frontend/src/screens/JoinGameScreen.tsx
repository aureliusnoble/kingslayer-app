import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import MedievalBackground from '../components/common/MedievalBackground';
import MedievalInput from '../components/common/MedievalInput';
import CodeInput, { CodeInputRef } from '../components/common/CodeInput';
import ErrorDisplay from '../components/common/ErrorDisplay';
import { useErrorHandler, getErrorTypeFromMessage } from '../hooks/useErrorHandler';
import { useToast } from '../components/common/ToastProvider';
import { ChevronLeft, DoorOpen, ClipboardCheck } from 'lucide-react';

export default function JoinGameScreen() {
  const navigate = useNavigate();
  const { loading, error, roomCode: storeRoomCode, gameState } = useGameStore();
  const { error: localError, setError, clearError } = useErrorHandler();
  const { showSuccess } = useToast();
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
      showSuccess('Code pasted successfully!');
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setError('Failed to paste from clipboard. Please try typing the code manually.', 'validation');
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
          {(error || localError) && (
            <ErrorDisplay
              error={error || localError?.message || null}
              type={error ? getErrorTypeFromMessage(error) : (localError?.type || 'generic')}
              onRetry={() => {
                clearError();
                if (roomCode.length === 6 && playerName.trim()) {
                  handleJoinGame();
                }
              }}
              onDismiss={() => {
                clearError();
                // Clear store error would need to be added to game store
              }}
              onHome={() => navigate('/')}
              size="medium"
            />
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