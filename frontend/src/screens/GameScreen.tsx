import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import Timer from '../components/common/Timer';
import RoleCard from '../components/game/RoleCard';
import PlayerList from '../components/game/PlayerList';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

export default function GameScreen() {
  const { 
    gameState, 
    myRole, 
    currentRoom, 
    roomChangeRequired,
    getMyPlayer,
    getPlayersInMyRoom,
    getOtherRoomPlayerCount,
    amILeader,
    canIAssassinate
  } = useGameStore();
  
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const myPlayer = getMyPlayer();
  const playersInRoom = getPlayersInMyRoom();
  const otherRoomCount = getOtherRoomPlayerCount();

  useEffect(() => {
    if (roomChangeRequired) {
      // Auto-confirm room if we're in the game phase
      socketService.confirmRoom(currentRoom);
    }
  }, [roomChangeRequired, currentRoom]);

  if (!gameState || !myRole || !myPlayer) return null;

  const roomName = currentRoom === 0 ? 'A' : 'B';
  const otherRoomName = currentRoom === 0 ? 'B' : 'A';
  const roomTimer = currentRoom === 0 
    ? gameState.timers.room0LeaderCooldown 
    : gameState.timers.room1LeaderCooldown;
  const otherRoomTimer = currentRoom === 0 
    ? gameState.timers.room1LeaderCooldown 
    : gameState.timers.room0LeaderCooldown;

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      {/* Room timers at top */}
      <div className="px-4 py-3 bg-neutral-dark text-white">
        <div className="flex justify-between items-center">
          <Timer seconds={roomTimer} label={`Room ${roomName} Timer`} />
          <Timer seconds={otherRoomTimer} label={`Room ${otherRoomName} Timer`} />
        </div>
      </div>

      {/* Room change notification */}
      {roomChangeRequired && (
        <Modal isOpen={true} title="📍 ROOM CHANGE">
          <div className="space-y-4 text-center">
            <p className="text-lg">You must go to:</p>
            <p className="text-3xl font-bold">ROOM {otherRoomName}</p>
            <p className="text-sm text-neutral-medium">Leave immediately!</p>
            <Button 
              fullWidth 
              onClick={() => socketService.confirmRoom(currentRoom === 0 ? 1 : 0)}
            >
              ACKNOWLEDGE
            </Button>
          </div>
        </Modal>
      )}

      {/* Main content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Role card */}
        <div className="flex justify-center">
          <RoleCard 
            role={myRole} 
            canAssassinate={canIAssassinate()}
            hasUsedAbility={myPlayer.hasUsedAbility}
          />
        </div>

        {/* Players in room */}
        <div>
          <h3 className="font-semibold mb-2">Players in Your Room:</h3>
          <PlayerList 
            players={playersInRoom}
            showPointing={true}
            showLeaderControls={amILeader()}
          />
        </div>

        {/* Other room info */}
        <div className="p-3 bg-neutral-light rounded-lg">
          <p className="text-sm text-neutral-medium">
            Room {otherRoomName}: {otherRoomCount} players
          </p>
        </div>

        {/* Leader status */}
        {amILeader() && (
          <div className="p-3 bg-green-100 text-green-800 rounded-lg">
            <p className="font-semibold">You are the Leader!</p>
            <p className="text-sm">
              {roomTimer && roomTimer > 0 
                ? `You can send a player in ${roomTimer} seconds`
                : 'You can send a player to the other room'
              }
            </p>
          </div>
        )}
      </div>

      {/* Bottom utilities */}
      <div className="p-4 border-t border-neutral-light">
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowRules(true)}
          >
            📋 Rules
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowSettings(true)}
          >
            ⚙️ Settings
          </Button>
        </div>
      </div>

      {/* Rules Modal */}
      <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="Quick Rules">
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold">Objective</h4>
            <p>Find and eliminate the opposing team's King.</p>
          </div>
          <div>
            <h4 className="font-semibold">Leader Election</h4>
            <p>Point at a player. Majority makes them Leader.</p>
          </div>
          <div>
            <h4 className="font-semibold">Leader Powers</h4>
            <p>After 2 minutes, can send one player to the other room.</p>
          </div>
          <div>
            <h4 className="font-semibold">Assassination</h4>
            <p>Assassins publicly name their target. One chance only!</p>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-neutral-medium">Room Code</p>
            <p className="font-mono text-lg">{gameState.roomCode}</p>
          </div>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              if (confirm('Are you sure you want to leave the game?')) {
                socketService.leaveGame();
                window.location.href = '/';
              }
            }}
          >
            Leave Game
          </Button>
        </div>
      </Modal>
    </div>
  );
}