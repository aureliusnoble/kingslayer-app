import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import clsx from 'clsx';

export default function LobbyScreen() {
  const navigate = useNavigate();
  const { gameState, playerId, amIHost } = useGameStore();

  if (!gameState) return null;

  const players = Object.values(gameState.players);
  const allReady = players.every(p => p.isReady);
  const canStart = amIHost() && allReady && players.length === gameState.playerCount;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    // Could add a toast notification here
  };

  const handleLeave = () => {
    socketService.leaveGame();
    navigate('/');
  };

  const handleToggleReady = () => {
    socketService.toggleReady();
  };

  const handleStartGame = () => {
    if (canStart) {
      socketService.startGame();
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom">
      <div className="flex items-center justify-between mb-8">
        <button onClick={handleLeave} className="text-neutral-dark">
          ← Leave
        </button>
        <h1 className="text-xl font-bold">Room: {gameState.roomCode}</h1>
      </div>

      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Players ({players.length}/{gameState.playerCount}):
          </h2>
          <div className="space-y-2">
            {Array.from({ length: gameState.playerCount }).map((_, index) => {
              const player = players[index];
              if (!player) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="p-3 bg-neutral-light rounded-lg text-neutral-medium"
                  >
                    • (Waiting...)
                  </div>
                );
              }

              return (
                <div
                  key={player.id}
                  className={clsx(
                    'p-3 rounded-lg flex items-center justify-between',
                    player.id === playerId ? 'bg-blue-background' : 'bg-neutral-light'
                  )}
                >
                  <span className="font-medium">
                    • {player.name} {player.isHost && '(Host)'} {player.id === playerId && '(You)'}
                  </span>
                  <span className={clsx(
                    'text-sm',
                    player.isReady ? 'text-green-600' : 'text-neutral-medium'
                  )}>
                    {player.connected ? (player.isReady ? '✓' : '○') : '⏳'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-neutral-medium mb-2">Share Code: {gameState.roomCode}</p>
            <Button
              variant="secondary"
              fullWidth
              onClick={handleCopyCode}
            >
              COPY CODE
            </Button>
          </div>

          {!amIHost() && (
            <Button
              variant={gameState.players[playerId!]?.isReady ? 'secondary' : 'primary'}
              fullWidth
              onClick={handleToggleReady}
            >
              {gameState.players[playerId!]?.isReady ? 'NOT READY' : 'READY'}
            </Button>
          )}

          {amIHost() && (
            <>
              <Button
                variant={gameState.players[playerId!]?.isReady ? 'secondary' : 'primary'}
                fullWidth
                onClick={handleToggleReady}
              >
                {gameState.players[playerId!]?.isReady ? 'NOT READY' : 'READY'}
              </Button>
              
              <Button
                variant="primary"
                fullWidth
                onClick={handleStartGame}
                disabled={!canStart}
              >
                {!allReady 
                  ? 'Waiting for players...' 
                  : players.length < gameState.playerCount
                  ? `Need ${gameState.playerCount - players.length} more players`
                  : 'START GAME'
                }
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}