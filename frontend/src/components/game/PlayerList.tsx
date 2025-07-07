import { Player } from 'kingslayer-shared';
import clsx from 'clsx';
import { socketService } from '../../services/socket';
import { useGameStore } from '../../stores/gameStore';

interface PlayerListProps {
  players: Player[];
  showPointing?: boolean;
  showLeaderControls?: boolean;
}

export default function PlayerList({ 
  players, 
  showPointing = true,
  showLeaderControls = false 
}: PlayerListProps) {
  const { playerId, getMyPlayer, amILeader, gameState } = useGameStore();
  const myPlayer = getMyPlayer();

  const handlePoint = (targetId: string) => {
    if (!showPointing || !myPlayer) return;
    
    // Toggle pointing
    if (myPlayer.pointingAt === targetId) {
      socketService.pointAtPlayer(null);
    } else {
      socketService.pointAtPlayer(targetId);
    }
  };

  const handleSendPlayer = (targetId: string) => {
    if (!amILeader() || !showLeaderControls) return;
    socketService.sendPlayer(targetId);
  };

  const getPointingAtPlayer = (player: Player): number => {
    return players.filter(p => p.pointingAt === player.id).length;
  };

  return (
    <div className="space-y-2">
      {players.map(player => {
        const pointCount = getPointingAtPlayer(player);
        const isMe = player.id === playerId;
        
        return (
          <div
            key={player.id}
            className={clsx(
              'p-3 rounded-lg flex items-center justify-between',
              isMe ? 'bg-blue-background' : 'bg-neutral-light',
              showPointing && !isMe && 'cursor-pointer hover:bg-neutral-medium hover:bg-opacity-20'
            )}
            onClick={() => !isMe && handlePoint(player.id)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {player.name} {isMe && '(You)'}
              </span>
              {player.isLeader && <span title="Leader">👑</span>}
              {!player.connected && <span className="text-neutral-medium text-sm">⏳</span>}
            </div>
            
            <div className="flex items-center gap-2">
              {pointCount > 0 && (
                <span className="text-sm text-neutral-medium">
                  {'← '.repeat(pointCount)}
                </span>
              )}
              
              {myPlayer?.pointingAt === player.id && (
                <span className="text-blue-primary">←</span>
              )}
              
              {showLeaderControls && amILeader() && !isMe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendPlayer(player.id);
                  }}
                  className="px-2 py-1 text-xs bg-neutral-dark text-white rounded hover:bg-neutral-medium"
                >
                  SEND
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}