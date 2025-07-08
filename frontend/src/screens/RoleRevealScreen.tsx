import { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FullScreenRoleCard from '../components/game/FullScreenRoleCard';
import RoomChangeModal from '../components/game/RoomChangeModal';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import { RoleType } from '../shared';
import clsx from 'clsx';
import MedievalBackground from '../components/common/MedievalBackground';
import { Crown, Swords, Shield, DoorClosed, Hammer, UserX, Bell, Info, Eye, CheckCircle } from 'lucide-react';

const roleInfo: Record<RoleType, string> = {
  KING: 'Stay alive! If the opposing Assassin correctly identifies you, your team loses.',
  ASSASSIN: 'Identify and publicly name the opposing King. You have one chance. In 8+ player games, you must visit your Swordsmith first.',
  GATEKEEPER: 'Once per game, secretly send any player in your room to the other room using the app.',
  SWORDSMITH: 'Your team\'s Assassin must reveal themselves to you before they can assassinate. Confirm their visit in the app.',
  GUARD: 'Your King cannot be assassinated while you\'re in the same room. Your protection is passive.',
  SPY: 'You appear as a member of the opposing team. Your fake role is shown to others, but you cannot use its ability.',
  SERVANT: 'You know who your King is from the start. Use this knowledge to protect them.'
};

export default function RoleRevealScreen() {
  const { myRole, servantKingId, gameState, currentRoom, roomChangeRequired, roomConfirmationProgress } = useGameStore();
  const [showInfo, setShowInfo] = useState(false);
  const [ready, setReady] = useState(false);
  const [showRoomAssignment, setShowRoomAssignment] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    if (ready && roomChangeRequired) {
      setShowRoomAssignment(true);
    }
  }, [ready, roomChangeRequired]);

  if (!myRole || !gameState) return null;

  const handleReady = () => {
    setReady(true);
    // Send ready state to backend
    socketService.setRoleReady();
    // Small delay to show room assignment after ready
    setTimeout(() => {
      setShowRoomAssignment(true);
    }, 500);
  };

  const handleConfirmRoom = () => {
    socketService.confirmRoom(currentRoom);
    setShowRoomAssignment(false);
  };

  const getServantKing = () => {
    if (!servantKingId || !gameState) return null;
    return gameState.players[servantKingId];
  };

  const servantKing = getServantKing();

  // Special layouts for certain roles
  if (myRole.type === 'SPY' && myRole.fakeRole) {
    return (
      <MedievalBackground variant="chamber">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
          <div className="max-w-sm w-full space-y-6">
            <h1 className="text-2xl font-bold text-center text-white font-display">YOUR SECRET ROLE</h1>
            
            <div className="space-y-4">
              {/* Real Role Card */}
              <div className={clsx(
                'p-4 rounded-lg border-4 transition-all duration-300 animate-card-flip',
                'bg-surface-medium',
                myRole.team === 'RED' ? 'border-red-primary shadow-lg shadow-red-primary/20' : 'border-blue-primary shadow-lg shadow-blue-primary/20'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <UserX size={16} className="text-medieval-metal-gold" />
                  <p className="text-sm font-medium text-gray-300">REAL ROLE:</p>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">
                    <UserX size={40} className="text-medieval-metal-gold" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">SPY</p>
                    <p className="text-lg font-semibold text-medieval-metal-gold">Team: {myRole.team}</p>
                  </div>
                </div>
              </div>

              {/* Fake Role Card */}
              <div className={clsx(
                'p-4 rounded-lg border-4 transition-all duration-300 animate-card-flip',
                'bg-surface-medium',
                myRole.fakeRole.team === 'RED' ? 'border-red-primary shadow-lg shadow-red-primary/20' : 'border-blue-primary shadow-lg shadow-blue-primary/20'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={16} className="text-medieval-metal-gold" />
                  <p className="text-sm font-medium text-gray-300">APPEARS AS:</p>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">
                    {myRole.fakeRole.type === 'KING' && <Crown size={40} className="text-medieval-metal-gold" />}
                    {myRole.fakeRole.type === 'ASSASSIN' && <Swords size={40} className="text-medieval-metal-gold" />}
                    {myRole.fakeRole.type === 'GATEKEEPER' && <DoorClosed size={40} className="text-medieval-metal-gold" />}
                    {myRole.fakeRole.type === 'SWORDSMITH' && <Hammer size={40} className="text-medieval-metal-gold" />}
                    {myRole.fakeRole.type === 'GUARD' && <Shield size={40} className="text-medieval-metal-gold" />}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{myRole.fakeRole.type}</p>
                    <p className="text-lg font-semibold text-medieval-metal-gold">Team: {myRole.fakeRole.team}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-medieval-flame-orange bg-opacity-20 text-medieval-flame-yellow rounded-lg text-sm border border-medieval-flame-orange">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-medieval-flame-yellow" />
                <span className="font-medium">Show {myRole.fakeRole.team} {myRole.fakeRole.type} to others!</span>
              </div>
            </div>

            <Button
              variant="medieval-blue"
              fullWidth
              onClick={() => setShowInfo(true)}
              className="bg-blue-primary bg-opacity-90 border-2 border-blue-primary shadow-lg"
            >
              <Info size={16} className="mr-2" />
              View Role Info
            </Button>

            {!ready ? (
              <Button
                variant="medieval-gold"
                fullWidth
                onClick={handleReady}
                className="bg-medieval-metal-gold bg-opacity-90 border-2 border-medieval-metal-gold shadow-lg"
              >
                <CheckCircle size={16} className="mr-2" />
                I'M READY
              </Button>
            ) : (
              <div className="p-4 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded-lg text-center">
                <p className="text-lg font-semibold text-green-400">✓ You are ready!</p>
                <p className="text-sm text-green-300">Waiting for other players...</p>
              </div>
            )}
          </div>

          <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title="SPY Role" theme="medieval">
            <p className="text-gray-300">{roleInfo.SPY}</p>
          </Modal>

          <Modal isOpen={showRoomAssignment} title="Room Assignment" theme="stone">
            <div className="space-y-4">
              <p className="text-lg text-white">You are assigned to:</p>
              <p className="text-3xl font-bold text-center text-medieval-metal-gold">ROOM {currentRoom === 0 ? 'A' : 'B'}</p>
              <p className="text-sm text-gray-300">Please move to your assigned room now.</p>
              <Button variant="medieval-gold" fullWidth onClick={handleConfirmRoom}>
                I'M IN MY ROOM
              </Button>
            </div>
          </Modal>

          {/* Full-screen role card for SPY - shows fake role */}
          <FullScreenRoleCard
            role={myRole.fakeRole}
            isVisible={showFullScreen}
            onClose={() => setShowFullScreen(false)}
          />

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

  if (myRole.type === 'SERVANT' && servantKing) {
    return (
      <MedievalBackground variant="chamber">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
          <div className="max-w-sm w-full space-y-6">
            <h1 className="text-2xl font-bold text-center text-white font-display">YOUR SECRET ROLE</h1>
            
            <div className={clsx(
              'p-6 rounded-lg text-center border-4 transition-all duration-300 animate-card-flip',
              'bg-surface-medium',
              myRole.team === 'RED' ? 'border-red-primary shadow-lg shadow-red-primary/20' : 'border-blue-primary shadow-lg shadow-blue-primary/20'
            )}>
              <div className="text-4xl mb-4">
                <Bell size={56} className="text-medieval-metal-gold mx-auto" />
              </div>
              <p className="text-3xl font-bold mb-2 text-white">SERVANT</p>
              <p className="text-lg text-gray-300">Team: {myRole.team}</p>
            </div>

            <div className="space-y-4">
              <p className="text-center font-medium text-white">Your King is:</p>
              <div className="p-4 bg-medieval-metal-gold bg-opacity-20 rounded-lg border-2 border-medieval-metal-gold text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown size={24} className="text-medieval-metal-gold" />
                </div>
                <p className="text-xl font-bold text-white">{servantKing.name}</p>
                <p className="text-lg text-medieval-metal-gold">KING</p>
              </div>
            </div>

            <div className="p-3 bg-medieval-flame-orange bg-opacity-20 text-medieval-flame-yellow rounded-lg text-sm border border-medieval-flame-orange">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-medieval-flame-yellow" />
                <span className="font-medium">Keep this secret! Protect your King at all costs.</span>
              </div>
            </div>

            <Button
              variant="medieval-blue"
              fullWidth
              onClick={() => setShowInfo(true)}
              className="bg-blue-primary bg-opacity-90 border-2 border-blue-primary shadow-lg"
            >
              <Info size={16} className="mr-2" />
              View Role Info
            </Button>

            {!ready ? (
              <Button
                variant="medieval-gold"
                fullWidth
                onClick={handleReady}
                className="bg-medieval-metal-gold bg-opacity-90 border-2 border-medieval-metal-gold shadow-lg"
              >
                <CheckCircle size={16} className="mr-2" />
                I'M READY
              </Button>
            ) : (
              <div className="p-4 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded-lg text-center">
                <p className="text-lg font-semibold text-green-400">✓ You are ready!</p>
                <p className="text-sm text-green-300">Waiting for other players...</p>
              </div>
            )}
          </div>

          <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title="SERVANT Role" theme="medieval">
            <p className="text-gray-300">{roleInfo.SERVANT}</p>
          </Modal>

          <Modal isOpen={showRoomAssignment} title="Room Assignment" theme="stone">
            <div className="space-y-4">
              <p className="text-lg text-white">You are assigned to:</p>
              <p className="text-3xl font-bold text-center text-medieval-metal-gold">ROOM {currentRoom === 0 ? 'A' : 'B'}</p>
              <p className="text-sm text-gray-300">Please move to your assigned room now.</p>
              <Button variant="medieval-gold" fullWidth onClick={handleConfirmRoom}>
                I'M IN MY ROOM
              </Button>
            </div>
          </Modal>

          {/* Full-screen role card for SERVANT */}
          <FullScreenRoleCard
            role={myRole}
            isVisible={showFullScreen}
            onClose={() => setShowFullScreen(false)}
          />

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

  // Normal role layout
  return (
    <MedievalBackground variant="chamber">
      <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
        <div className="max-w-sm w-full space-y-6">
          <h1 className="text-2xl font-bold text-center text-white font-display">YOUR SECRET ROLE</h1>
          
          <div className={clsx(
            'p-8 rounded-lg text-center border-4 transition-all duration-300 animate-card-flip',
            'bg-surface-medium',
            myRole.team === 'RED' ? 'border-red-primary shadow-lg shadow-red-primary/20' : 'border-blue-primary shadow-lg shadow-blue-primary/20'
          )}>
            <div className="text-6xl mb-4">
              {/* Role icons - using Lucide icons */}
              {myRole.type === 'KING' && <Crown size={72} className="text-medieval-metal-gold mx-auto" />}
              {myRole.type === 'ASSASSIN' && <Swords size={72} className="text-medieval-metal-gold mx-auto" />}
              {myRole.type === 'GATEKEEPER' && <DoorClosed size={72} className="text-medieval-metal-gold mx-auto" />}
              {myRole.type === 'SWORDSMITH' && <Hammer size={72} className="text-medieval-metal-gold mx-auto" />}
              {myRole.type === 'GUARD' && <Shield size={72} className="text-medieval-metal-gold mx-auto" />}
            </div>
            <p className="text-3xl font-bold mb-2 text-white">{myRole.type}</p>
            <p className="text-xl font-semibold text-medieval-metal-gold drop-shadow-lg">Team: {myRole.team}</p>
          </div>

          <Button
            variant="medieval-blue"
            fullWidth
            onClick={() => setShowInfo(true)}
            className="bg-blue-primary bg-opacity-90 border-2 border-blue-primary shadow-lg"
          >
            <Info size={16} className="mr-2" />
            View Role Info
          </Button>

          {!ready && (
            <Button
              variant="medieval-gold"
              fullWidth
              onClick={handleReady}
              className="bg-medieval-metal-gold bg-opacity-90 border-2 border-medieval-metal-gold shadow-lg"
            >
              <CheckCircle size={16} className="mr-2" />
              I'M READY
            </Button>
          )}

          {ready && (
            <div className="p-4 bg-green-500 bg-opacity-20 border-2 border-green-500 rounded-lg text-center">
              <p className="text-lg font-semibold text-green-400">✓ You are ready!</p>
              <p className="text-sm text-green-300">Waiting for other players...</p>
            </div>
          )}
        </div>

        <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title={`${myRole.type} Role`} theme="medieval">
          <p className="text-gray-300">{roleInfo[myRole.type]}</p>
        </Modal>

        <Modal isOpen={showRoomAssignment} title="Room Assignment" theme="stone">
          <div className="space-y-4">
            <p className="text-lg text-white">You are assigned to:</p>
            <p className="text-3xl font-bold text-center text-medieval-metal-gold">ROOM {currentRoom === 0 ? 'A' : 'B'}</p>
            <p className="text-sm text-gray-300">Please move to your assigned room now.</p>
            
            {/* Room confirmation progress */}
            {roomConfirmationProgress && (
              <div className="bg-surface-light p-3 rounded border border-medieval-stone-light">
                <p className="text-sm font-semibold text-white">
                  Players Confirmed: {roomConfirmationProgress.confirmed}/{roomConfirmationProgress.total}
                </p>
                {roomConfirmationProgress.names.length > 0 && (
                  <p className="text-xs text-gray-300 mt-1">
                    Waiting for: {roomConfirmationProgress.names.join(', ')}
                  </p>
                )}
              </div>
            )}
            
            <Button variant="medieval-gold" fullWidth onClick={handleConfirmRoom}>
              I'M IN MY ROOM
            </Button>
          </div>
        </Modal>

        {/* Full-screen role card - spies see their REAL role during setup */}
        <FullScreenRoleCard
          role={myRole}
          isVisible={showFullScreen}
          onClose={() => setShowFullScreen(false)}
        />

        {/* Kick notification modal */}
        <RoomChangeModal
          isVisible={roomChangeRequired}
          newRoom={currentRoom === 0 ? 1 : 0}
          onConfirm={() => socketService.confirmRoom(currentRoom === 0 ? 1 : 0)}
          blocking={true}
        />
      </div>
    </MedievalBackground>
  );
}