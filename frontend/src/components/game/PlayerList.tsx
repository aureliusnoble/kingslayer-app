import { Player } from '../../shared';
import clsx from 'clsx';
import { socketService } from '../../services/socket';
import { useGameStore } from '../../stores/gameStore';
import { Crown, Clock } from 'lucide-react';

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
  const { playerId, getMyPlayer, amILeader, liveTimers, currentRoom } = useGameStore();
  const myPlayer = getMyPlayer();
  
  // Check if kicks are available (timer = 0)
  const myRoomTimer = liveTimers[currentRoom === 0 ? 'room0' : 'room1'];
  const canKick = amILeader() && myRoomTimer === 0;

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
              'p-3 rounded-lg flex items-center justify-between border border-medieval-stone-light transition-colors',
              isMe ? 'bg-medieval-metal-gold bg-opacity-20 border-medieval-metal-gold' : 'bg-surface-light',
              showPointing && !isMe && 'cursor-pointer hover:bg-surface-medium'
            )}
            onClick={() => !isMe && handlePoint(player.id)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {player.name} {isMe && <span className="text-medieval-metal-gold">(You)</span>}
              </span>
              {player.isLeader && <span title="Leader"><Crown size={16} className="text-medieval-metal-gold" /></span>}
              {!player.connected && <span title="Connecting..."><Clock size={16} className="text-medieval-flame-yellow animate-pulse" /></span>}
            </div>
            
            <div className="flex items-center gap-2">
              {pointCount > 0 && (
                <span className="text-sm text-medieval-metal-gold font-bold">
                  {'← '.repeat(pointCount)}
                </span>
              )}
              
              {myPlayer?.pointingAt === player.id && (
                <span className="text-medieval-metal-gold text-lg font-bold">←</span>
              )}
              
              {showLeaderControls && amILeader() && !isMe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canKick) {
                      handleSendPlayer(player.id);
                    }
                  }}
                  disabled={!canKick}
                  className={clsx(
                    'px-3 py-1 text-xs font-bold rounded',
                    canKick
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  )}
                  title={canKick ? 'Kick this player' : 'Timer must reach 0 to kick'}
                >
                  KICK
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}