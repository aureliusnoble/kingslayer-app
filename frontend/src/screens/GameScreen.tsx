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
import MedievalBackground from '../components/common/MedievalBackground';
import { Clock, Eye, BookOpen, Settings, Crown, DoorOpen, Users, Shield } from 'lucide-react';
import clsx from 'clsx';

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
      return (
        <div className="flex items-center gap-2 text-medieval-stone-light text-sm font-medium">
          <Clock size={16} />
          <span>{label}: No timer active</span>
        </div>
      );
    }
    
    if (timer === 0) {
      return (
        <div className="flex items-center gap-2 text-green-400 font-bold text-sm animate-pulse">
          <Shield size={16} />
          <span>{label}: ✓ KICK AVAILABLE</span>
        </div>
      );
    }
    
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const isUrgent = timer <= 30;
    
    return (
      <div className={clsx(
        'flex items-center gap-2 font-bold text-sm font-mono drop-shadow-md',
        isUrgent ? 'text-red-highlight animate-pulse' : 'text-medieval-flame-yellow'
      )}>
        <Clock size={16} />
        <span>{label}: {minutes}:{seconds.toString().padStart(2, '0')}</span>
      </div>
    );
  };

  return (
    <MedievalBackground variant="chamber">
      <div className="min-h-screen flex flex-col safe-top safe-bottom">
        {/* Medieval Timer Bar */}
        <div className="px-4 py-3 bg-surface-dark border-b-2 border-medieval-metal-gold">
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
          <div className="p-4 bg-surface-medium border-2 border-medieval-metal-gold rounded-lg text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DoorOpen size={24} className="text-medieval-metal-gold" />
              <h2 className="text-2xl font-bold text-white font-display drop-shadow-lg">
                ROOM {roomName}
              </h2>
            </div>
            <p className="text-sm text-medieval-stone-light font-medium">Your current location</p>
          </div>

          {/* Players in room */}
          <div className="bg-surface-medium rounded-lg p-4 border border-medieval-stone-light">
            <div className="flex items-center gap-2 mb-3">
              <Users size={20} className="text-medieval-metal-gold" />
              <h3 className="font-semibold text-white text-lg drop-shadow-md">Players in Your Room:</h3>
            </div>
            <PlayerList 
              players={playersInRoom}
              showPointing={true}
              showLeaderControls={amILeader()}
            />
          </div>

          {/* Other room info */}
          <div className="p-3 bg-surface-light rounded-lg border border-medieval-stone-light">
            <div className="flex items-center gap-2">
              <DoorOpen size={16} className="text-medieval-stone-light" />
              <p className="text-sm text-gray-300">
                Room {otherRoomName}: {otherRoomCount} players
              </p>
            </div>
          </div>

          {/* Leader section */}
          {amILeader() ? (
            <div className="p-4 bg-medieval-metal-gold bg-opacity-20 border-4 border-medieval-metal-gold rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown size={32} className="text-medieval-metal-gold" />
              </div>
              <div className="text-lg font-bold text-medieval-metal-gold mb-2">YOU ARE THE LEADER</div>
              <div className="text-sm">
                {myRoomTimer === 0
                  ? <span className="text-green-400 font-bold">Ready to kick players</span>
                  : <span className="text-medieval-flame-yellow">Kick available in {myRoomTimer} seconds</span>
                }
              </div>
            </div>
          ) : (
            <Button
              variant="medieval-gold"
              onClick={() => socketService.declareLeader()}
              fullWidth
              className="bg-medieval-metal-gold bg-opacity-80 border-2 border-medieval-metal-gold text-lg font-bold"
            >
              <Crown size={24} className="mr-2" />
              DECLARE MYSELF LEADER
            </Button>
          )}
        </div>

        {/* Bottom utilities */}
        <div className="p-4 border-t border-medieval-stone-light bg-surface-dark">
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="medieval-stone"
              size="medium"
              onClick={() => setShowFullScreen(true)}
              className="border-2 border-current flex flex-col items-center gap-1 py-3"
            >
              <Eye size={20} />
              <span className="text-xs font-medium">Role</span>
            </Button>
            <Button
              variant="medieval-stone"
              size="medium"
              onClick={() => setShowRules(true)}
              className="flex flex-col items-center gap-1 py-3"
            >
              <BookOpen size={20} />
              <span className="text-xs font-medium">Rules</span>
            </Button>
            <Button
              variant="medieval-stone"
              size="medium"
              onClick={() => setShowSettings(true)}
              className="flex flex-col items-center gap-1 py-3"
            >
              <Settings size={20} />
              <span className="text-xs font-medium">Settings</span>
            </Button>
          </div>
        </div>

        {/* Rules Modal */}
        <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="Quick Rules" theme="medieval">
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold text-medieval-metal-gold">Objective</h4>
              <p className="text-gray-300">Find and eliminate the opposing team's King.</p>
            </div>
            <div>
              <h4 className="font-semibold text-medieval-metal-gold">Leader Election</h4>
              <p className="text-gray-300">Point at a player. Majority makes them Leader.</p>
            </div>
            <div>
              <h4 className="font-semibold text-medieval-metal-gold">Leader Powers</h4>
              <p className="text-gray-300">After 2 minutes, can send one player to the other room.</p>
            </div>
            <div>
              <h4 className="font-semibold text-medieval-metal-gold">Assassination</h4>
              <p className="text-gray-300">Assassins publicly name their target. One chance only!</p>
            </div>
          </div>
        </Modal>

        {/* Settings Modal */}
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings" theme="stone">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Room Code</p>
              <p className="font-mono text-lg text-medieval-metal-gold">{gameState.roomCode}</p>
            </div>
            <Button
              variant="medieval-red"
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
    </MedievalBackground>
  );
}