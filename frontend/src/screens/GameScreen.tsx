import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import { useTimer } from '../hooks/useTimer';
import RoleCard from '../components/game/RoleCard';
import PlayerList from '../components/game/PlayerList';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import FullScreenRoleCard from '../components/game/FullScreenRoleCard';
import RoomChangeModal from '../components/game/RoomChangeModal';

export default function GameScreen() {
  const { 
    gameState, 
    myRole, 
    currentRoom, 
    roomChangeRequired,
    liveTimers,
    getMyPlayer,
    getPlayersInMyRoom,
    getOtherRoomPlayerCount,
    amILeader,
    canIAssassinate
  } = useGameStore();
  
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useTimer(); // Start live countdown

  const myPlayer = getMyPlayer();
  const playersInRoom = getPlayersInMyRoom();
  const otherRoomCount = getOtherRoomPlayerCount();

  // Removed auto-confirmation - players must manually confirm kicks via modal

  // Ensure timers are initialized when entering playing phase
  useEffect(() => {
    if (gameState && gameState.phase === 'playing' && (liveTimers.room0 === null || liveTimers.room1 === null)) {
      console.log(`🟡 GameScreen: Initializing timers for playing phase`);
      const store = useGameStore.getState();
      if (liveTimers.room0 === null) store.setLiveTimer(0, 120);
      if (liveTimers.room1 === null) store.setLiveTimer(1, 120);
    }
  }, [gameState?.phase, liveTimers.room0, liveTimers.room1]);

  if (!gameState || !myRole || !myPlayer) return null;

  const roomName = currentRoom === 0 ? 'A' : 'B';
  const otherRoomName = currentRoom === 0 ? 'B' : 'A';
  // Timer values with fallback to default if game is in playing phase
  const myRoomTimer = liveTimers[currentRoom === 0 ? 'room0' : 'room1'];
  const otherRoomTimer = liveTimers[currentRoom === 0 ? 'room1' : 'room0'];
  
  // If timers are null but game is in playing phase, they should be active
  const effectiveMyRoomTimer = gameState.phase === 'playing' && myRoomTimer === null ? 120 : myRoomTimer;
  const effectiveOtherRoomTimer = gameState.phase === 'playing' && otherRoomTimer === null ? 120 : otherRoomTimer;

  // Timer display helper
  const renderTimer = (timer: number | null, label: string) => {
    if (timer === null) {
      return <div className="text-gray-400 text-sm">{label}: No timer active</div>;
    }
    
    if (timer === 0) {
      return (
        <div className="text-green-400 font-bold text-sm">
          {label}: ✓ KICK AVAILABLE
        </div>
      );
    }
    
    return (
      <div className="text-orange-400 font-bold text-sm">
        {label}: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom">
      {/* Room kick timers */}
      <div className="px-4 py-3 bg-neutral-dark text-white">
        <div className="flex justify-between items-center">
          {renderTimer(effectiveMyRoomTimer, `Room ${roomName}`)}
          {renderTimer(effectiveOtherRoomTimer, `Room ${otherRoomName}`)}
        </div>
      </div>

      {/* Full-screen room change notification */}
      <RoomChangeModal
        isVisible={roomChangeRequired}
        newRoom={currentRoom}
        onConfirm={() => socketService.confirmRoom(currentRoom)}
        blocking={true}
      />

      {/* Main content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Role card */}
        <div className="flex justify-center">
          <RoleCard 
            role={myRole} 
            canAssassinate={canIAssassinate()}
            hasUsedAbility={myPlayer?.hasUsedAbility || false}
          />
        </div>

        {/* Current room indicator */}
        <div className="p-4 bg-blue-100 border-2 border-blue-500 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-blue-800">
            🚪 YOU ARE IN ROOM {roomName}
          </h2>
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

        {/* Leader section */}
        {amILeader() ? (
          <div className="p-4 bg-yellow-100 border-4 border-yellow-500 rounded-lg text-center">
            <div className="text-4xl mb-2">👑</div>
            <div className="text-lg font-bold text-yellow-800">YOU ARE THE LEADER</div>
            <div className="text-sm mt-2">
              {myRoomTimer === 0
                ? <span className="text-green-600 font-bold">Ready to kick players</span>
                : <span className="text-orange-600">Kick available in {myRoomTimer} seconds</span>
              }
            </div>
          </div>
        ) : (
          <Button
            variant="primary"
            onClick={() => socketService.declareLeader()}
            className="bg-yellow-500 text-black font-bold border-2 border-yellow-600 hover:bg-yellow-400"
            fullWidth
          >
            👑 DECLARE MYSELF LEADER
          </Button>
        )}
      </div>

      {/* Bottom utilities */}
      <div className="p-4 border-t border-neutral-light">
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowFullScreen(true)}
            className="border-2 border-current"
          >
            📱 Show Role
          </Button>
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

      {/* Full-screen role card - spies see their FAKE role during game */}
      <FullScreenRoleCard
        role={myRole.type === 'SPY' && myRole.fakeRole ? myRole.fakeRole : myRole}
        isVisible={showFullScreen}
        onClose={() => setShowFullScreen(false)}
      />
    </div>
  );
}