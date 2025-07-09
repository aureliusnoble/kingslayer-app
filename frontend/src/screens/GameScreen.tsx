import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { socketService } from '../services/socket';
import { useTimer } from '../hooks/useTimer';
import PlayerList from '../components/game/PlayerList';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import FullScreenRoleCard from '../components/game/FullScreenRoleCard';
import RoomChangeModal from '../components/game/RoomChangeModal';
import MedievalBackground from '../components/common/MedievalBackground';
import { Clock, Eye, BookOpen, Settings, Crown, DoorOpen, Users, Shield, Info, Zap, Swords, DoorClosed, Hammer, UserX, Bell } from 'lucide-react';
import clsx from 'clsx';
import { TutorialGameState, TutorialPlayer } from '../data/tutorialMockData';

interface GameScreenProps {
  tutorialMode?: boolean;
  tutorialData?: {
    gameState: TutorialGameState;
    myRole: TutorialPlayer['role'];
    currentRoom: 0 | 1;
    players: TutorialPlayer[];
    timers: {
      room0: number | null;
      room1: number | null;
    };
  };
  onTutorialInteraction?: (action: string) => void;
}

export default function GameScreen({ 
  tutorialMode = false, 
  tutorialData,
  onTutorialInteraction
}: GameScreenProps = {}) {
  const navigate = useNavigate();
  const gameStoreData = useGameStore();
  
  // Use tutorial data if in tutorial mode, otherwise use game store data
  const gameState = tutorialMode ? tutorialData?.gameState : gameStoreData.gameState;
  const myRole = tutorialMode ? tutorialData?.myRole : gameStoreData.myRole;
  const currentRoom = tutorialMode ? tutorialData?.currentRoom : gameStoreData.currentRoom;
  const roomChangeRequired = tutorialMode ? false : gameStoreData.roomChangeRequired;
  const liveTimers = tutorialMode ? 
    { room0: tutorialData?.timers.room0, room1: tutorialData?.timers.room1 } : 
    gameStoreData.liveTimers;
  
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [showAbility, setShowAbility] = useState(false);
  const [showGatekeeperSelect, setShowGatekeeperSelect] = useState(false);
  const [showSwordsmithSelect, setShowSwordsmithSelect] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showKickModal, setShowKickModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedKickTarget, setSelectedKickTarget] = useState<string | null>(null);

  if (!tutorialMode) {
    useTimer(); // Start live countdown only in real game mode
  }

  // Tutorial mode player functions
  const getTutorialMyPlayer = () => {
    if (!tutorialData) return null;
    return tutorialData.players.find(p => p.name === 'You');
  };

  const getTutorialPlayersInRoom = () => {
    if (!tutorialData) return [];
    return tutorialData.players.filter(p => p.currentRoom === currentRoom).map(p => ({
      ...p,
      socketId: p.id,
      connected: true,
      isReady: true,
      isRoleReady: true,
      isRoomConfirmed: true,
      hasUsedAbility: p.hasUsedAbility || false,
      isHost: p.isHost || false
    }));
  };

  const getTutorialOtherRoomCount = () => {
    if (!tutorialData) return 0;
    return tutorialData.players.filter(p => p.currentRoom !== currentRoom).length;
  };

  const getTutorialAmILeader = () => {
    const tutorialMyPlayer = getTutorialMyPlayer();
    return tutorialMyPlayer?.isLeader || false;
  };

  // Use tutorial functions or game store functions based on mode
  const myPlayer = tutorialMode ? getTutorialMyPlayer() : gameStoreData.getMyPlayer();
  const playersInRoom = tutorialMode ? getTutorialPlayersInRoom() : gameStoreData.getPlayersInMyRoom();
  const otherRoomCount = tutorialMode ? getTutorialOtherRoomCount() : gameStoreData.getOtherRoomPlayerCount();
  const amILeader = tutorialMode ? getTutorialAmILeader : gameStoreData.amILeader;
  const canIAssassinate = tutorialMode ? () => true : gameStoreData.canIAssassinate;

  // Handle game restart - navigate to lobby when phase changes to lobby
  useEffect(() => {
    if (gameState && gameState.phase === 'lobby' && myRole === null) {
      // Game was restarted, navigate to lobby
      navigate('/lobby');
    }
  }, [gameState?.phase, myRole, navigate]);

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
  const myRoomTimer = currentRoom !== undefined ? liveTimers[currentRoom === 0 ? 'room0' : 'room1'] : null;
  const otherRoomTimer = currentRoom !== undefined ? liveTimers[currentRoom === 0 ? 'room1' : 'room0'] : null;
  
  // If timers are null but game is in playing phase, they should be active
  const effectiveMyRoomTimer = gameState?.phase === 'playing' && myRoomTimer === null ? 120 : myRoomTimer;
  const effectiveOtherRoomTimer = gameState?.phase === 'playing' && otherRoomTimer === null ? 120 : otherRoomTimer;

  // Helper functions for role info and abilities
  const getRoleInfo = () => {
    const infos: Record<string, string> = {
      KING: 'Stay alive! If identified by the enemy Assassin, your team loses.',
      ASSASSIN: 'Identify and publicly name the opposing King. In 8+ player games you must show your full role to your Swordsmith first.',
      GATEKEEPER: 'Send any player in your room to the other room.',
      SWORDSMITH: 'Confirm when your Assassin visits you.',
      GUARD: 'Protect your King by being in the same room.',
      SPY: 'Deceive the enemy while gathering information. DO NOT SHOW THIS SCREEN TO ANYONE ELSE.',
      SERVANT: 'You know your King. Protect them!'
    };
    return infos[myRole.type] || '';
  };

  const getAbilityButtonText = () => {
    // Always show "Ability" on main screen to prevent revealing private info to other players
    return 'Ability';
  };


  const handleAbilityClick = () => {
    switch (myRole.type) {
      case 'ASSASSIN':
        setShowAbility(true);
        break;
      case 'GATEKEEPER':
        if (!myPlayer?.hasUsedAbility) {
          setShowGatekeeperSelect(true);
        } else {
          setShowAbility(true); // Show "already used" message
        }
        break;
      case 'SWORDSMITH':
        setShowSwordsmithSelect(true);
        break;
      default:
        setShowAbility(true); // Show passive ability explanation
    }
  };

  const handleGatekeeperSend = () => {
    if (selectedTarget) {
      socketService.gatekeeperSend(selectedTarget);
      setShowGatekeeperSelect(false);
      setSelectedTarget(null);
    }
  };

  const handleSwordsmithConfirm = () => {
    if (selectedTarget) {
      socketService.swordsmithConfirm(selectedTarget);
      setShowSwordsmithSelect(false);
      setSelectedTarget(null);
    }
  };

  const handleKickPlayer = () => {
    if (selectedKickTarget) {
      socketService.kickPlayer(selectedKickTarget);
      setShowKickModal(false);
      setSelectedKickTarget(null);
    }
  };

  const openKickModal = () => {
    setShowKickModal(true);
  };

  // Roster helper functions
  const getUniqueRoles = () => {
    if (!gameState) return [];
    const roles = Object.values(gameState.players)
      .map(player => player.role?.type)
      .filter(Boolean) as string[];
    return [...new Set(roles)];
  };

  const getRoleIcon = (roleType: string) => {
    const iconProps = { size: 24, className: "text-medieval-metal-gold" };
    switch (roleType) {
      case 'KING': return <Crown {...iconProps} />;
      case 'ASSASSIN': return <Swords {...iconProps} />;
      case 'GATEKEEPER': return <DoorClosed {...iconProps} />;
      case 'SWORDSMITH': return <Hammer {...iconProps} />;
      case 'GUARD': return <Shield {...iconProps} />;
      case 'SPY': return <UserX {...iconProps} />;
      case 'SERVANT': return <Bell {...iconProps} />;
      default: return <Crown {...iconProps} />;
    }
  };

  const getRoleDescription = (roleType: string) => {
    const descriptions: Record<string, string> = {
      KING: 'Stay alive! Lose if identified by enemy Assassin.',
      ASSASSIN: 'Identify and name the opposing King publicly.',
      GATEKEEPER: 'Send any player to the other room (one-time ability).',
      SWORDSMITH: 'Confirm Assassin visits to unlock their assassination.',
      GUARD: 'Protect your King by staying in the same room.',
      SPY: 'Deceive enemies while gathering information.',
      SERVANT: 'Know and protect your King.'
    };
    return descriptions[roleType] || '';
  };

  // Timer display helper
  const renderTimer = (timer: number | null | undefined, label: string) => {
    if (timer === null || timer === undefined) {
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
        <div 
          className="px-4 py-3 bg-surface-dark border-b-2 border-medieval-metal-gold"
          data-tutorial="room-timers"
        >
          <div className="flex justify-between items-center">
            {renderTimer(effectiveMyRoomTimer, `Room ${roomName}`)}
            {renderTimer(effectiveOtherRoomTimer, `Room ${otherRoomName}`)}
          </div>
        </div>

      {/* Full-screen room change notification */}
      {currentRoom !== undefined && (
        <RoomChangeModal
          isVisible={roomChangeRequired}
          newRoom={currentRoom}
          onConfirm={() => socketService.confirmRoom(currentRoom)}
          blocking={true}
        />
      )}

        {/* Main content */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Top Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Button
              variant="secondary"
              size="medium"
              onClick={() => {
                setShowFullScreen(true);
                onTutorialInteraction?.('show-role-clicked');
              }}
              className="bg-medieval-stone-dark text-white border-2 border-medieval-stone-medium flex flex-col items-center gap-2 py-4 hover:bg-medieval-stone-medium"
              data-tutorial="show-role-button"
            >
              <Eye size={24} />
              <span className="text-sm font-medium">Show Role</span>
            </Button>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => {
                setShowRoleInfo(true);
                onTutorialInteraction?.('role-info-clicked');
              }}
              className="bg-medieval-stone-dark text-white border-2 border-medieval-stone-medium flex flex-col items-center gap-2 py-4 hover:bg-medieval-stone-medium"
              data-tutorial="role-info-button"
            >
              <Info size={24} />
              <span className="text-sm font-medium">Role Info</span>
            </Button>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => {
                handleAbilityClick();
                onTutorialInteraction?.('ability-clicked');
              }}
              className="bg-medieval-stone-dark text-white border-2 border-medieval-stone-medium flex flex-col items-center gap-2 py-4 hover:bg-medieval-stone-medium"
              data-tutorial="ability-button"
            >
              <Zap size={24} />
              <span className="text-sm font-medium">{getAbilityButtonText()}</span>
            </Button>
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
          <div 
            className="bg-surface-medium rounded-lg p-4 border border-medieval-stone-light"
            data-tutorial="player-list"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users size={20} className="text-medieval-metal-gold" />
              <h3 className="font-semibold text-white text-lg drop-shadow-md">Players in Your Room:</h3>
            </div>
            <PlayerList 
              players={playersInRoom}
              showLeaderControls={amILeader()}
            />
          </div>

          {/* Other room info */}
          <div 
            className="p-3 bg-surface-light rounded-lg border border-medieval-stone-light"
            data-tutorial="other-room-count"
          >
            <div className="flex items-center gap-2">
              <DoorOpen size={16} className="text-medieval-stone-light" />
              <p className="text-sm text-gray-300">
                Room {otherRoomName}: {otherRoomCount} players
              </p>
            </div>
          </div>

          {/* Leader section */}
          {amILeader() ? (
            <div 
              className="p-4 bg-medieval-metal-gold bg-opacity-20 border-4 border-medieval-metal-gold rounded-lg text-center"
              data-tutorial="leader-status"
            >
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
              onClick={() => {
                if (tutorialMode) {
                  onTutorialInteraction?.('declare-leader-clicked');
                } else {
                  socketService.declareLeader();
                }
              }}
              fullWidth
              className="bg-medieval-metal-gold bg-opacity-80 border-2 border-medieval-metal-gold text-lg font-bold"
              data-tutorial="leader-button"
            >
              <Crown size={24} className="mr-2" />
              DECLARE MYSELF LEADER
            </Button>
          )}
        </div>

        {/* Bottom utilities */}
        <div className="p-4 border-t border-medieval-stone-light bg-surface-dark">
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-3 w-full max-w-md">
              <Button
                variant="medieval-stone"
                size="medium"
                onClick={() => setShowRoster(true)}
                className="border-2 border-current flex flex-col items-center gap-1 py-3 flex-1"
                fullWidth
                data-tutorial="roster-button"
              >
                <Users size={20} />
                <span className="text-xs font-medium">Roster</span>
              </Button>
              <Button
                variant="medieval-stone"
                size="medium"
                onClick={() => setShowRules(true)}
                className="flex flex-col items-center gap-1 py-3 flex-1"
                fullWidth
                data-tutorial="rules-button"
              >
                <BookOpen size={20} />
                <span className="text-xs font-medium">Rules</span>
              </Button>
              <Button
                variant="medieval-stone"
                size="medium"
                onClick={() => setShowSettings(true)}
                className="flex flex-col items-center gap-1 py-3 flex-1"
                fullWidth
              >
                <Settings size={20} />
                <span className="text-xs font-medium">Settings</span>
              </Button>
            </div>
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
              <p className="text-gray-300">Elect a leader (with more than 50% of the room pointing at them).</p>
            </div>
            <div>
              <h4 className="font-semibold text-medieval-metal-gold">Leader Powers</h4>
              <p className="text-gray-300">After 2 minutes, can send one player (other than themselves) to the other room.</p>
            </div>
            <div>
              <h4 className="font-semibold text-medieval-metal-gold">Assassination</h4>
              <p className="text-gray-300">Assassins publicly name their target. One chance only!</p>
            </div>
            <div>
              <h4 className="font-semibold text-medieval-metal-gold">Role Visibility</h4>
              <p className="text-gray-300">You may only show your role card to other players, not your private role info or ability.</p>
            </div>
          </div>
        </Modal>

        {/* Settings Modal */}
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings" theme="stone">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Room Code</p>
              <div className="flex items-center gap-3">
                <p className="font-mono text-lg text-medieval-metal-gold">{gameState.roomCode}</p>
                <Button
                  variant="medieval-stone"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(gameState.roomCode);
                    // You could add a toast notification here if available
                  }}
                  className="px-3 py-1 text-xs"
                >
                  Copy
                </Button>
              </div>
            </div>
            {myPlayer?.isHost && (
              <>
                <Button
                  variant="medieval-stone"
                  fullWidth
                  onClick={openKickModal}
                  className="bg-medieval-stone-medium bg-opacity-90 border-2 border-medieval-stone-light text-white"
                >
                  <UserX size={20} className="mr-2" />
                  Kick Player
                </Button>
                <Button
                  variant="medieval-gold"
                  fullWidth
                  onClick={() => {
                    if (confirm('Are you sure you want to restart the game? This will send everyone back to the lobby.')) {
                      socketService.restartGame();
                    }
                  }}
                  className="text-white"
                >
                  Restart Game (Host Only)
                </Button>
              </>
            )}
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

        {/* Role Info Modal */}
        <Modal 
          isOpen={showRoleInfo} 
          onClose={() => setShowRoleInfo(false)} 
          title={`${myRole.type} Role`}
          theme="medieval"
          size="medium"
        >
          <div className="space-y-3">
            <p className="text-white leading-relaxed">{getRoleInfo()}</p>
            {myRole.type === 'SPY' && (
              <div className="mt-4 p-3 rounded-lg bg-medieval-flame-orange bg-opacity-20 border border-medieval-flame-orange">
                <p className="text-sm text-medieval-flame-yellow font-medium">
                  You are a SPY for Team {myRole.team}. You appear as {myRole.fakeRole?.team} {myRole.fakeRole?.type} to others!
                </p>
              </div>
            )}
            {myRole.type === 'SERVANT' && gameState?.servantInfo && (
              <div className="mt-4 p-3 rounded-lg bg-blue-primary bg-opacity-20 border border-blue-primary">
                <p className="text-sm text-blue-highlight font-medium">
                  Your King: {gameState.players[gameState.servantInfo[myPlayer?.id || '']]?.name || 'Unknown'}
                </p>
              </div>
            )}
          </div>
        </Modal>

        {/* Ability Modal */}
        <Modal 
          isOpen={showAbility} 
          onClose={() => setShowAbility(false)} 
          title={myRole.type === 'ASSASSIN' ? 'ASSASSINATE' : `${myRole.type} ABILITY`}
          theme={myRole.type === 'ASSASSIN' ? 'royal' : 'medieval'}
          size="medium"
        >
          {myRole.type === 'ASSASSIN' ? (
            gameState && gameState.playerCount >= 8 && !canIAssassinate() ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-lg font-semibold text-red-400">
                  <Shield size={24} />
                  <span>Locked</span>
                </div>
                <p className="text-white leading-relaxed">
                  You must visit your team's Swordsmith first before you can assassinate.
                </p>
                <Button variant="medieval-stone" fullWidth onClick={() => setShowAbility(false)} className="text-white">
                  CLOSE
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-lg font-semibold text-medieval-flame-orange">
                  <Swords size={24} />
                  <span>IMPORTANT</span>
                </div>
                <div className="space-y-3 text-white">
                  <p>Publicly name a player in your room as the target for assassination.</p>
                  <p className="font-bold text-medieval-flame-yellow">
                    This is done VERBALLY, not in the app!
                  </p>
                  <p className="text-sm">
                    Stand up and clearly announce: "I assassinate [player name]"
                  </p>
                  <div className="p-3 rounded-lg bg-red-primary bg-opacity-20 border border-red-primary">
                    <p className="text-sm text-red-highlight font-medium">
                      Remember: You only get ONE chance. If they're not the King, you lose!
                    </p>
                  </div>
                </div>
                <Button variant="medieval-gold" fullWidth onClick={() => setShowAbility(false)} className="text-white font-bold">
                  UNDERSTOOD
                </Button>
              </div>
            )
          ) : myRole.type === 'GATEKEEPER' && myPlayer?.hasUsedAbility ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-lg font-semibold text-gray-400">
                <DoorClosed size={24} />
                <span>Already Used</span>
              </div>
              <p className="text-white leading-relaxed">
                You have already used your Gatekeeper ability to send a player to the other room.
              </p>
              <Button variant="medieval-stone" fullWidth onClick={() => setShowAbility(false)} className="text-white">
                CLOSE
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-white leading-relaxed">
                {myRole.type === 'GUARD' && 'Your ability is passive. Protect your King by staying in the same room as them.'}
                {myRole.type === 'SPY' && (
                  <div>
                    <p>Your ability is passive deception.</p>
                    <div className="mt-3 p-3 rounded-lg bg-medieval-flame-orange bg-opacity-20 border border-medieval-flame-orange">
                      <p className="text-sm text-medieval-flame-yellow font-medium">
                        You are a SPY for Team {myRole.team}. Others see you as {myRole.fakeRole?.team} {myRole.fakeRole?.type}.
                      </p>
                    </div>
                  </div>
                )}
                {myRole.type === 'SERVANT' && (
                  <div>
                    <p>Your ability is passive knowledge.</p>
                    {gameState?.servantInfo && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-primary bg-opacity-20 border border-blue-primary">
                        <p className="text-sm text-blue-highlight font-medium">
                          You serve {gameState.players[gameState.servantInfo[myPlayer?.id || '']]?.name || 'Unknown'} as your King.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {myRole.type === 'KING' && 'Your role is to stay alive. Avoid being identified by the enemy Assassin.'}
              </div>
              <Button variant="medieval-stone" fullWidth onClick={() => setShowAbility(false)} className="text-white">
                CLOSE
              </Button>
            </div>
          )}
        </Modal>

        {/* Gatekeeper Select Modal */}
        <Modal 
          isOpen={showGatekeeperSelect} 
          onClose={() => {
            setShowGatekeeperSelect(false);
            setSelectedTarget(null);
          }} 
          title="GATEKEEPER ACTION"
          theme="stone"
          size="medium"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-white">
              <DoorClosed size={24} />
              <span>Send to other room:</span>
            </div>
            <div className="space-y-2">
              {playersInRoom.map((player: any) => (
                <label 
                  key={player.id} 
                  className={clsx(
                    'flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200',
                    'bg-surface-light hover:bg-medieval-stone-light border border-medieval-stone-light',
                    selectedTarget === player.id && 'bg-medieval-metal-gold border-medieval-metal-gold'
                  )}
                >
                  <input
                    type="radio"
                    name="target"
                    value={player.id}
                    checked={selectedTarget === player.id}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="mr-3 text-medieval-metal-gold"
                  />
                  <span className="text-white font-medium">{player.name}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-300 italic">This action is private.</p>
            <div className="flex gap-3">
              <Button
                variant="medieval-stone"
                onClick={() => {
                  setShowGatekeeperSelect(false);
                  setSelectedTarget(null);
                }}
                className="text-white"
              >
                CANCEL
              </Button>
              <Button
                variant="medieval-gold"
                onClick={handleGatekeeperSend}
                disabled={!selectedTarget}
                className="text-white font-bold"
              >
                SEND
              </Button>
            </div>
          </div>
        </Modal>

        {/* Swordsmith Select Modal */}
        <Modal 
          isOpen={showSwordsmithSelect} 
          onClose={() => {
            setShowSwordsmithSelect(false);
            setSelectedTarget(null);
          }} 
          title="SWORDSMITH CONFIRMATION"
          theme="medieval"
          size="medium"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-white">
              <Hammer size={24} />
              <span>Which player showed you their full Team and Role?</span>
            </div>
            <div className="space-y-2">
              {playersInRoom.map((player: any) => (
                <label 
                  key={player.id} 
                  className={clsx(
                    'flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200',
                    'bg-surface-light hover:bg-medieval-stone-light border border-medieval-stone-light',
                    selectedTarget === player.id && 'bg-medieval-metal-gold border-medieval-metal-gold'
                  )}
                >
                  <input
                    type="radio"
                    name="assassin"
                    value={player.id}
                    checked={selectedTarget === player.id}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="mr-3 text-medieval-metal-gold"
                  />
                  <span className="text-white font-medium">{player.name}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-300 italic">This confirms the Assassin showed their full identity and can now assassinate.</p>
            <div className="flex gap-3">
              <Button
                variant="medieval-stone"
                onClick={() => {
                  setShowSwordsmithSelect(false);
                  setSelectedTarget(null);
                }}
                className="text-white"
              >
                CANCEL
              </Button>
              <Button
                variant="medieval-gold"
                onClick={handleSwordsmithConfirm}
                disabled={!selectedTarget}
                className="text-white font-bold"
              >
                CONFIRM
              </Button>
            </div>
          </div>
        </Modal>

        {/* Roster Modal */}
        <Modal 
          isOpen={showRoster} 
          onClose={() => setShowRoster(false)} 
          title="Game Roster"
          theme="medieval"
          size="large"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300 mb-4">Roles currently in this game:</p>
            <div className="space-y-3">
              {getUniqueRoles().map(roleType => (
                <div key={roleType} className="p-3 rounded-lg bg-surface-light border border-medieval-stone-light">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(roleType)}
                    <div>
                      <h4 className="font-semibold text-white text-lg">{roleType}</h4>
                      <p className="text-sm text-gray-300">{getRoleDescription(roleType)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        {/* Kick Player Modal */}
        <Modal
          isOpen={showKickModal}
          onClose={() => {
            setShowKickModal(false);
            setSelectedKickTarget(null);
          }}
          title="Kick Player"
          theme="stone"
          size="medium"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-white">
              <UserX size={24} />
              <span>Select player to kick:</span>
            </div>
            <div className="space-y-2">
              {Object.values(gameState.players).filter(p => p.id !== myPlayer?.id).map(player => (
                <label 
                  key={player.id} 
                  className={clsx(
                    'flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200',
                    'bg-surface-light hover:bg-medieval-stone-light border border-medieval-stone-light',
                    selectedKickTarget === player.id && 'bg-medieval-metal-gold border-medieval-metal-gold'
                  )}
                >
                  <input
                    type="radio"
                    name="kickTarget"
                    value={player.id}
                    checked={selectedKickTarget === player.id}
                    onChange={(e) => setSelectedKickTarget(e.target.value)}
                    className="mr-3 text-medieval-metal-gold"
                  />
                  <span className="text-white font-medium">{player.name}</span>
                  {player.isHost && (
                    <Crown size={16} className="ml-2 text-medieval-metal-gold" />
                  )}
                </label>
              ))}
            </div>
            <p className="text-sm text-red-highlight italic font-medium">
              Warning: Kicked players will be removed from the game permanently.
            </p>
            <div className="flex gap-3">
              <Button
                variant="medieval-stone"
                onClick={() => {
                  setShowKickModal(false);
                  setSelectedKickTarget(null);
                }}
                className="text-white"
              >
                Cancel
              </Button>
              <Button
                variant="medieval-red"
                onClick={handleKickPlayer}
                disabled={!selectedKickTarget}
                className="text-white font-bold"
              >
                Kick Player
              </Button>
            </div>
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