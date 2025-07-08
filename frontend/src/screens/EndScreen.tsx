import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import Button from '../components/common/Button';
import RoomChangeModal from '../components/game/RoomChangeModal';
import MedievalBackground from '../components/common/MedievalBackground';
import clsx from 'clsx';
import { socketService } from '../services/socket';
import { Player } from '../shared';
import { Crown, Trophy, Skull, Home, RefreshCw, Shield, Swords, DoorClosed, Hammer, Bell, UserX } from 'lucide-react';

export default function EndScreen() {
  const navigate = useNavigate();
  const { gameState, myRole, roomChangeRequired, currentRoom } = useGameStore();

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

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'KING': return <Crown size={20} className="text-medieval-metal-gold" />;
      case 'ASSASSIN': return <Swords size={20} className="text-medieval-metal-gold" />;
      case 'GATEKEEPER': return <DoorClosed size={20} className="text-medieval-metal-gold" />;
      case 'SWORDSMITH': return <Hammer size={20} className="text-medieval-metal-gold" />;
      case 'GUARD': return <Shield size={20} className="text-medieval-metal-gold" />;
      case 'SPY': return <UserX size={20} className="text-medieval-metal-gold" />;
      case 'SERVANT': return <Bell size={20} className="text-medieval-metal-gold" />;
      default: return null;
    }
  };

  return (
    <MedievalBackground variant="throne-room">
      <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
        <div className="max-w-md w-full space-y-6">
          {/* Victory/Defeat Header */}
          <div className="text-center">
            <div className="mb-4">
              {didWin ? (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy size={32} className="text-medieval-metal-gold animate-pulse" />
                  <h1 className="text-4xl font-bold text-medieval-metal-gold font-display drop-shadow-lg">
                    VICTORY!
                  </h1>
                  <Trophy size={32} className="text-medieval-metal-gold animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Skull size={32} className="text-red-highlight" />
                  <h1 className="text-4xl font-bold text-red-highlight font-display drop-shadow-lg">
                    DEFEAT
                  </h1>
                  <Skull size={32} className="text-red-highlight" />
                </div>
              )}
            </div>
            
            {/* Winner Proclamation */}
            <div className={clsx(
              'p-6 rounded-lg mb-4 border-4 bg-surface-medium',
              winner === 'RED' ? 'border-red-primary shadow-lg shadow-red-primary/30' : 'border-blue-primary shadow-lg shadow-blue-primary/30'
            )}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Crown size={24} className="text-medieval-metal-gold" />
                <h2 className="text-2xl font-bold text-white font-display drop-shadow-lg">
                  {winner} TEAM WINS!
                </h2>
                <Crown size={24} className="text-medieval-metal-gold" />
              </div>
              <p className="text-lg text-medieval-stone-light font-semibold drop-shadow-md">{reason}</p>
            </div>
          </div>

          {/* Final Roles Reveal */}
          <div className="bg-surface-medium rounded-lg p-4 border border-medieval-stone-light">
            <h3 className="font-bold mb-3 text-white text-lg flex items-center gap-2 drop-shadow-md">
              <Crown size={24} className="text-medieval-metal-gold" />
              Royal Court Revealed:
            </h3>
            <div className="space-y-2 text-sm">
              {players.map((player: Player) => (
                <div 
                  key={player.id} 
                  className={clsx(
                    'flex justify-between items-center p-3 rounded border-2',
                    'bg-surface-light transition-all duration-200',
                    player.role?.team === 'RED' 
                      ? 'border-red-primary bg-red-primary bg-opacity-10' 
                      : 'border-blue-primary bg-blue-primary bg-opacity-10'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{player.name}</span>
                    {player.role?.type === 'KING' && reason.includes(player.name) && (
                      <Skull size={16} className="text-red-highlight" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(player.role?.type || '')}
                    <span className="text-medieval-stone-light font-medium">
                      {player.role?.team} {player.role?.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="medieval-gold"
              size="large"
              fullWidth
              onClick={handlePlayAgain}
              className="text-lg font-bold"
            >
              <RefreshCw size={16} className="mr-2" />
              PLAY AGAIN
            </Button>
            
            <Button
              variant="medieval-stone"
              size="large"
              fullWidth
              onClick={() => {
                socketService.leaveGame();
                navigate('/');
              }}
              className="text-lg font-bold"
            >
              <Home size={16} className="mr-2" />
              RETURN HOME
            </Button>
          </div>
        </div>

        {/* Kick notification modal */}
        <RoomChangeModal
          isVisible={roomChangeRequired}
          newRoom={currentRoom}
          onConfirm={() => socketService.confirmRoom(currentRoom)}
          blocking={true}
        />
      </div>
    </MedievalBackground>
  );
}