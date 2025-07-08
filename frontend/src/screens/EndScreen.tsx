import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import Button from '../components/common/Button';
import clsx from 'clsx';
import { socketService } from '../services/socket';
import { Player } from '../shared';

export default function EndScreen() {
  const navigate = useNavigate();
  const { gameState, myRole } = useGameStore();

  if (!gameState || !gameState.victory) {
    return null;
  }

  const { winner, reason } = gameState.victory;
  const didWin = myRole?.team === winner;
  const players = Object.values(gameState.players);

  const handlePlayAgain = () => {
    // For now, just go back to home
    // Could implement a rematch feature later
    socketService.leaveGame();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            {didWin ? '🎉 VICTORY! 🎉' : '💀 DEFEAT 💀'}
          </h1>
          
          <div className={clsx(
            'p-4 rounded-lg mb-4',
            winner === 'RED' ? 'bg-red-background' : 'bg-blue-background'
          )}>
            <h2 className="text-2xl font-bold mb-2">{winner} TEAM WINS!</h2>
            <p className="text-lg">{reason}</p>
          </div>
        </div>

        <div className="bg-neutral-light rounded-lg p-4">
          <h3 className="font-semibold mb-3">Final Roles:</h3>
          <div className="space-y-2 text-sm">
            {players.map((player: Player) => (
              <div 
                key={player.id} 
                className={clsx(
                  'flex justify-between items-center p-2 rounded',
                  player.role?.team === 'RED' ? 'bg-red-background' : 'bg-blue-background'
                )}
              >
                <span className="font-medium">{player.name}</span>
                <span>
                  {player.role?.team} {player.role?.type}
                  {player.role?.type === 'KING' && reason.includes(player.name) && ' †'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handlePlayAgain}
          >
            PLAY AGAIN
          </Button>
          
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              socketService.leaveGame();
              navigate('/');
            }}
          >
            RETURN HOME
          </Button>
        </div>
      </div>
    </div>
  );
}