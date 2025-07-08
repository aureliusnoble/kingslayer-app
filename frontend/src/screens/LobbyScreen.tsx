import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Button from '../components/common/Button';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import { Player } from '../shared';
import clsx from 'clsx';
import MedievalBackground from '../components/common/MedievalBackground';
import { LogOut, Copy, Users, Crown, Shield, CheckCircle, Clock, Link } from 'lucide-react';

export default function LobbyScreen() {
  const navigate = useNavigate();
  const { gameState, playerId, amIHost } = useGameStore();

  if (!gameState) return null;

  const players = Object.values(gameState.players);
  const allReady = players.every((p: Player) => p.isReady);
  const canStart = amIHost() && allReady && players.length === gameState.playerCount;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    // Could add a toast notification here
  };

  const handleCopyURL = () => {
    const lobbyURL = `${window.location.origin}/lobby/${gameState.roomCode}`;
    navigator.clipboard.writeText(lobbyURL);
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
                Players ({players.length}/{gameState.playerCount})
              </h2>
            </div>
            
            <div className="space-y-2">
              {Array.from({ length: gameState.playerCount }).map((_, index) => {
                const player = players[index];
                if (!player) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="p-3 bg-surface-light rounded-lg border border-dashed border-medieval-stone-light"
                    >
                      <div className="flex items-center gap-2 text-medieval-metal-gold">
                        <div className="w-6 h-6 rounded-full bg-medieval-stone-dark border border-medieval-metal-gold"></div>
                        <span className="font-semibold drop-shadow-md">Awaiting Player...</span>
                      </div>
                    </div>
                  );
                }

                return (
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
                );
              })}
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

            {/* Start Game (Host Only) */}
            {amIHost() && (
              <Button
                variant="medieval-red"
                size="large"
                fullWidth
                onClick={handleStartGame}
                disabled={!canStart}
                className="text-lg font-bold bg-red-primary bg-opacity-90 border-2 border-red-primary shadow-lg"
              >
                {!allReady 
                  ? 'Awaiting Players...' 
                  : players.length < gameState.playerCount
                  ? `Need ${gameState.playerCount - players.length} More Players`
                  : 'START'
                }
              </Button>
            )}
          </div>
        </div>
      </div>
    </MedievalBackground>
  );
}