import { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FullScreenRoleCard from '../components/game/FullScreenRoleCard';
import RoomChangeModal from '../components/game/RoomChangeModal';
import { socketService } from '../services/socket';
import { useGameStore } from '../stores/gameStore';
import { RoleType } from '../shared';
import clsx from 'clsx';

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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
        <div className="max-w-sm w-full space-y-6">
          <h1 className="text-2xl font-bold text-center">YOUR SECRET ROLE</h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-100 rounded-lg border-2 border-red-primary">
              <p className="text-sm font-medium text-neutral-medium mb-1">REAL ROLE:</p>
              <p className="text-xl font-bold">SPY</p>
              <p className="text-lg">Team: {myRole.team}</p>
            </div>

            <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-primary">
              <p className="text-sm font-medium text-neutral-medium mb-1">APPEARS AS:</p>
              <p className="text-xl font-bold">{myRole.fakeRole.type}</p>
              <p className="text-lg">Team: {myRole.fakeRole.team}</p>
            </div>
          </div>

          <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
            ⚠️ Show {myRole.fakeRole.team} {myRole.fakeRole.type} to others!
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowFullScreen(true)}
            className="border-4 border-current"
          >
            📱 SHOW MY ROLE
          </Button>

          <Button
            variant="primary"
            fullWidth
            onClick={() => setShowInfo(true)}
          >
            ℹ️ View Role Info
          </Button>

          {!ready ? (
            <Button
              variant="primary"
              fullWidth
              onClick={handleReady}
            >
              I'M READY
            </Button>
          ) : (
            <div className="p-4 bg-blue-100 border-2 border-blue-500 rounded-lg text-center">
              <p className="text-lg font-semibold text-blue-800">✓ You are ready!</p>
              <p className="text-sm text-blue-600">Waiting for other players...</p>
            </div>
          )}
        </div>

        <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title="SPY Role">
          <p>{roleInfo.SPY}</p>
        </Modal>

        <Modal isOpen={showRoomAssignment} title="Room Assignment">
          <div className="space-y-4">
            <p className="text-lg">You are assigned to:</p>
            <p className="text-3xl font-bold text-center">ROOM {currentRoom === 0 ? 'A' : 'B'}</p>
            <p className="text-sm text-neutral-medium">Please move to your assigned room now.</p>
            <Button fullWidth onClick={handleConfirmRoom}>
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
    );
  }

  if (myRole.type === 'SERVANT' && servantKing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
        <div className="max-w-sm w-full space-y-6">
          <h1 className="text-2xl font-bold text-center">YOUR SECRET ROLE</h1>
          
          <div className={clsx(
            'p-6 rounded-lg text-center',
            myRole.team === 'RED' ? 'role-card-red' : 'role-card-blue'
          )}>
            <p className="text-3xl font-bold mb-2">SERVANT</p>
            <p className="text-lg">Team: {myRole.team}</p>
          </div>

          <div className="space-y-2">
            <p className="text-center font-medium">Your King is:</p>
            <div className="p-4 bg-yellow-100 rounded-lg border-2 border-yellow-500 text-center">
              <p className="text-xl font-bold">{servantKing.name}</p>
              <p className="text-lg">👑 KING</p>
            </div>
          </div>

          <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
            ⚠️ Keep this secret! Protect your King at all costs.
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowFullScreen(true)}
            className="border-4 border-current"
          >
            📱 SHOW MY ROLE
          </Button>

          <Button
            variant="primary"
            fullWidth
            onClick={() => setShowInfo(true)}
          >
            ℹ️ View Role Info
          </Button>

          {!ready ? (
            <Button
              variant="primary"
              fullWidth
              onClick={handleReady}
            >
              I'M READY
            </Button>
          ) : (
            <div className="p-4 bg-blue-100 border-2 border-blue-500 rounded-lg text-center">
              <p className="text-lg font-semibold text-blue-800">✓ You are ready!</p>
              <p className="text-sm text-blue-600">Waiting for other players...</p>
            </div>
          )}
        </div>

        <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title="SERVANT Role">
          <p>{roleInfo.SERVANT}</p>
        </Modal>

        <Modal isOpen={showRoomAssignment} title="Room Assignment">
          <div className="space-y-4">
            <p className="text-lg">You are assigned to:</p>
            <p className="text-3xl font-bold text-center">ROOM {currentRoom === 0 ? 'A' : 'B'}</p>
            <p className="text-sm text-neutral-medium">Please move to your assigned room now.</p>
            <Button fullWidth onClick={handleConfirmRoom}>
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
    );
  }

  // Normal role layout
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      <div className="max-w-sm w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">YOUR SECRET ROLE</h1>
        
        <div className={clsx(
          'p-8 rounded-lg text-center',
          myRole.team === 'RED' ? 'role-card-red' : 'role-card-blue'
        )}>
          <div className="text-6xl mb-4">
            {/* Role icons - using emojis as placeholders */}
            {myRole.type === 'KING' && '👑'}
            {myRole.type === 'ASSASSIN' && '🗡️'}
            {myRole.type === 'GATEKEEPER' && '🚪'}
            {myRole.type === 'SWORDSMITH' && '⚔️'}
            {myRole.type === 'GUARD' && '🛡️'}
          </div>
          <p className="text-3xl font-bold mb-2">{myRole.type}</p>
        </div>
        
        <p className="text-center text-lg font-medium">Team: {myRole.team}</p>

        <Button
          variant="secondary"
          fullWidth
          onClick={() => setShowFullScreen(true)}
          className="border-4 border-current"
        >
          📱 SHOW MY ROLE
        </Button>

        <Button
          variant="secondary"
          fullWidth
          onClick={() => setShowInfo(true)}
        >
          ℹ️ View Role Info
        </Button>

        {!ready && (
          <Button
            variant="primary"
            fullWidth
            onClick={handleReady}
          >
            I'M READY
          </Button>
        )}
      </div>

      <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title={`${myRole.type} Role`}>
        <p>{roleInfo[myRole.type]}</p>
      </Modal>

      <Modal isOpen={showRoomAssignment} title="Room Assignment">
        <div className="space-y-4">
          <p className="text-lg">You are assigned to:</p>
          <p className="text-3xl font-bold text-center">ROOM {currentRoom === 0 ? 'A' : 'B'}</p>
          <p className="text-sm text-neutral-medium">Please move to your assigned room now.</p>
          
          {/* Room confirmation progress */}
          {roomConfirmationProgress && (
            <div className="bg-neutral-light p-3 rounded">
              <p className="text-sm font-semibold">
                Players Confirmed: {roomConfirmationProgress.confirmed}/{roomConfirmationProgress.total}
              </p>
              {roomConfirmationProgress.names.length > 0 && (
                <p className="text-xs text-neutral-medium mt-1">
                  Waiting for: {roomConfirmationProgress.names.join(', ')}
                </p>
              )}
            </div>
          )}
          
          <Button fullWidth onClick={handleConfirmRoom}>
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
  );
}