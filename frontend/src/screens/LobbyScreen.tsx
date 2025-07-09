import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import { Player } from '../shared';
import clsx from 'clsx';
import MedievalBackground from '../components/common/MedievalBackground';
import { useToast } from '../components/common/ToastProvider';
import { LogOut, Copy, Users, Crown, Shield, CheckCircle, Clock, Link, AlertTriangle, UserX } from 'lucide-react';

export default function LobbyScreen() {
  const navigate = useNavigate();
  const { gameState, playerId, amIHost } = useGameStore();
  const { showSuccess } = useToast();
  const [showKickModal, setShowKickModal] = useState(false);
  const [selectedKickTarget, setSelectedKickTarget] = useState<string | null>(null);
  const [renderCount, setRenderCount] = useState(0);

  if (!gameState) return null;

  const players = Object.values(gameState.players);
  
  // Debug: Track renders and log player states
  useEffect(() => {
    const newRenderCount = renderCount + 1;
    setRenderCount(newRenderCount);
    
    if (import.meta.env.DEV) {
      console.log(`📺 LOBBY RENDER #${newRenderCount} - Player states:`, 
        players.map(p => ({
          name: p.name,
          connected: p.connected,
          ready: p.isReady,
          id: p.id.substring(0, 8)
        }))
      );
    }
  });

  // Debug: Log when player states change
  useEffect(() => {
    if (import.meta.env.DEV && gameState) {
      console.log('🔄 LOBBY: Game state updated, connection states:', 
        Object.entries(gameState.players).map(([id, p]) => ({
          name: p.name,
          id: id.substring(0, 8),
          connected: p.connected,
          ready: p.isReady
        }))
      );
    }
  }, [gameState]);
  const allReady = players.every((p: Player) => p.isReady);
  const isEvenPlayerCount = players.length % 2 === 0;
  const hasMinPlayers = players.length >= 6;
  const canStart = amIHost() && allReady && isEvenPlayerCount && hasMinPlayers;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    showSuccess('Room code copied');
  };

  const handleCopyURL = () => {
    const lobbyURL = `${window.location.origin}/lobby/${gameState.roomCode}`;
    navigator.clipboard.writeText(lobbyURL);
    showSuccess('Lobby link copied');
  };

  const handleLeave = () => {
    socketService.leaveGame();
    navigate('/');
  };

  const handleToggleReady = () => {
    socketService.toggleReady();
  };

  const handleStartGame = () => {
    console.log('START GAME clicked', {
      canStart,
      amIHost: amIHost(),
      allReady,
      playerCount: players.length,
      maxPlayers: gameState.playerCount,
      players: players.map(p => ({ name: p.name, isReady: p.isReady, isHost: p.isHost }))
    });
    
    if (canStart) {
      console.log('Calling socketService.startGame()');
      socketService.startGame();
    } else {
      console.log('Cannot start game - conditions not met');
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

  const kickablePlayerOptions = players.filter(p => p.id !== playerId); // Can't kick yourself

  // Navigate to role reveal when game starts
  useEffect(() => {
    if (gameState && gameState.phase === 'setup') {
      navigate('/role');
    }
  }, [gameState, navigate]);

  return (
    <MedievalBackground variant="battlements">
      <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom">
        {/* Header with Leave and Room Code */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleLeave}
            className="flex items-center gap-2 text-white hover:text-red-highlight transition-colors"
          >
            <LogOut size={20} />
            <span>Leave</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-medieval-metal-gold" />
            <h1 className="text-xl font-bold text-white font-mono tracking-wider">
              {gameState.roomCode}
            </h1>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {/* Players Section */}
          <div className="bg-surface-medium rounded-lg p-4 border border-medieval-stone-light">
            <div className="flex items-center gap-2 mb-4">
              <Users size={24} className="text-medieval-metal-gold" />
              <h2 className="text-xl font-bold text-medieval-metal-gold drop-shadow-lg">
                Players ({players.length}/14)
              </h2>
            </div>
            
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={clsx(
                    'p-3 rounded-lg flex items-center justify-between transition-all duration-200',
                    'bg-surface-light border border-medieval-stone-light',
                    player.id === playerId && 'border-medieval-metal-gold bg-medieval-metal-gold bg-opacity-10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                      player.isReady 
                        ? 'bg-green-500 border-green-500' 
                        : 'bg-medieval-stone-dark border-medieval-stone-light'
                    )}>
                      {player.isReady && <CheckCircle size={14} className="text-white" />}
                    </div>
                    
                    <span className="font-medium text-white">
                      {player.name}
                      {player.isHost && (
                        <Crown size={16} className="inline ml-2 text-medieval-metal-gold" />
                      )}
                      {player.id === playerId && (
                        <span className="text-medieval-metal-gold ml-1">(You)</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!player.connected && (
                      <Clock size={16} className="text-yellow-400 animate-pulse" />
                    )}
                    <span className={clsx(
                      'text-sm font-bold drop-shadow-md',
                      player.isReady ? 'text-green-300' : 'text-medieval-stone-light'
                    )}>
                      {player.connected ? (player.isReady ? 'Ready' : 'Not Ready') : 'Connecting...'}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Show invitation message */}
              {players.length < 14 && (
                <div className="p-3 bg-surface-light rounded-lg border border-dashed border-medieval-stone-light">
                  <div className="flex items-center gap-2 text-medieval-metal-gold">
                    <div className="w-6 h-6 rounded-full bg-medieval-stone-dark border border-medieval-metal-gold"></div>
                    <span className="font-semibold drop-shadow-md">
                      Invite more players (up to {14 - players.length} more can join)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Room Code Sharing */}
            <div className="bg-surface-medium rounded-lg p-4 border border-medieval-stone-light space-y-4">
              <div className="flex items-center gap-2">
                <Copy size={16} className="text-medieval-metal-gold" />
                <p className="text-sm text-gray-300 font-medium">Share with others:</p>
              </div>
              
              {/* Room Code */}
              <div>
                <p className="text-xs text-medieval-stone-light mb-2">Room Code:</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-medieval-stone-dark rounded-lg p-3 border border-medieval-stone-light">
                    <span className="font-mono text-lg font-bold text-medieval-metal-gold tracking-wider">
                      {gameState.roomCode}
                    </span>
                  </div>
                  <Button
                    variant="medieval-stone"
                    onClick={handleCopyCode}
                    className="px-4 bg-medieval-stone-medium bg-opacity-90 border-2 border-medieval-stone-light shadow-lg"
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              {/* Lobby URL */}
              <div>
                <p className="text-xs text-medieval-stone-light mb-2">Direct Link:</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-medieval-stone-dark rounded-lg p-3 border border-medieval-stone-light">
                    <span className="text-sm text-medieval-metal-gold font-medium break-all">
                      {window.location.origin}/lobby/{gameState.roomCode}
                    </span>
                  </div>
                  <Button
                    variant="medieval-stone"
                    onClick={handleCopyURL}
                    className="px-4 bg-medieval-stone-medium bg-opacity-90 border-2 border-medieval-stone-light shadow-lg"
                  >
                    <Link size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Ready Toggle */}
            <Button
              variant={gameState.players[playerId!]?.isReady ? 'medieval-stone' : 'medieval-gold'}
              size="large"
              fullWidth
              onClick={handleToggleReady}
              className={`text-lg font-bold border-2 shadow-lg ${
                gameState.players[playerId!]?.isReady 
                  ? 'bg-medieval-stone-medium bg-opacity-90 border-medieval-stone-light' 
                  : 'bg-medieval-metal-gold bg-opacity-90 border-medieval-metal-gold'
              }`}
            >
              {gameState.players[playerId!]?.isReady ? 'NOT READY' : 'READY'}
            </Button>

            {/* Host Controls */}
            {amIHost() && (
              <>
                {/* Validation Messages */}
                {(!hasMinPlayers || !isEvenPlayerCount) && (
                  <div className="p-3 bg-yellow-600 bg-opacity-20 text-yellow-200 rounded-lg text-sm border border-yellow-600">
                    {!hasMinPlayers && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>Need at least 6 players to start</span>
                      </div>
                    )}
                    {hasMinPlayers && !isEvenPlayerCount && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>Need an even number of players to start (current: {players.length})</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Host Action Buttons */}
                <div className="flex gap-3">
                  {kickablePlayerOptions.length > 0 && (
                    <Button
                      variant="medieval-stone"
                      size="large"
                      onClick={openKickModal}
                      className="bg-medieval-stone-medium bg-opacity-90 border-2 border-medieval-stone-light shadow-lg"
                    >
                      <UserX size={20} className="mr-2" />
                      Kick Player
                    </Button>
                  )}
                  <Button
                    variant="medieval-red"
                    size="large"
                    fullWidth
                    onClick={handleStartGame}
                    disabled={!canStart}
                    className="text-lg font-bold bg-red-primary bg-opacity-90 border-2 border-red-primary shadow-lg"
                  >
                    {!hasMinPlayers 
                      ? `Need ${6 - players.length} More Players (Min: 6)`
                      : !isEvenPlayerCount
                      ? 'Need 1 More Player (Even Count Required)'
                      : !allReady 
                      ? 'Awaiting Players to Ready...' 
                      : 'START GAME'
                    }
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
            {kickablePlayerOptions.map(player => (
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
    </MedievalBackground>
  );
}