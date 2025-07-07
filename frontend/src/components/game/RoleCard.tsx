import { useState } from 'react';
import { Role } from 'kingslayer-shared';
import clsx from 'clsx';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { socketService } from '../../services/socket';
import { useGameStore } from '../../stores/gameStore';

interface RoleCardProps {
  role: Role;
  canAssassinate?: boolean;
  hasUsedAbility?: boolean;
}

const roleIcons: Record<string, string> = {
  KING: '👑',
  ASSASSIN: '🗡️',
  GATEKEEPER: '🚪',
  SWORDSMITH: '⚔️',
  GUARD: '🛡️',
  SPY: '🕵️',
  SERVANT: '🙇'
};

export default function RoleCard({ role, canAssassinate = false, hasUsedAbility = false }: RoleCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [showAbility, setShowAbility] = useState(false);
  const [showGatekeeperSelect, setShowGatekeeperSelect] = useState(false);
  const [showSwordsmithSelect, setShowSwordsmithSelect] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  
  const { gameState, currentRoom, getPlayersInMyRoom } = useGameStore();
  
  const displayRole = role.fakeRole || role;
  const playersInRoom = getPlayersInMyRoom();

  const handleAbilityClick = () => {
    switch (role.type) {
      case 'ASSASSIN':
        setShowAbility(true);
        break;
      case 'GATEKEEPER':
        if (!hasUsedAbility) {
          setShowGatekeeperSelect(true);
        }
        break;
      case 'SWORDSMITH':
        setShowSwordsmithSelect(true);
        break;
      default:
        setShowInfo(true);
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

  const getRoleInfo = () => {
    const infos: Record<string, string> = {
      KING: 'Stay alive! If identified by the enemy Assassin, your team loses.',
      ASSASSIN: 'Identify and publicly name the opposing King.',
      GATEKEEPER: 'Send any player in your room to the other room.',
      SWORDSMITH: 'Confirm when your Assassin visits you.',
      GUARD: 'Protect your King by being in the same room.',
      SPY: 'Deceive the enemy while gathering information.',
      SERVANT: 'You know your King. Protect them!'
    };
    return infos[role.type] || '';
  };

  const needsSwordsmith = gameState && gameState.playerCount >= 8 && role.type === 'ASSASSIN';

  return (
    <>
      <div className={clsx(
        'relative p-6 rounded-lg flex flex-col items-center space-y-4',
        displayRole.team === 'RED' ? 'role-card-red' : 'role-card-blue'
      )}>
        <div className="text-5xl">{roleIcons[displayRole.type]}</div>
        <h2 className="text-2xl font-bold">{displayRole.type}</h2>
        
        <div className="flex gap-4">
          <button
            onClick={() => setShowInfo(true)}
            className="p-2 bg-white bg-opacity-50 rounded-lg"
          >
            ℹ️
          </button>
          
          {(role.type === 'ASSASSIN' || role.type === 'GATEKEEPER' || role.type === 'SWORDSMITH') && (
            <button
              onClick={handleAbilityClick}
              className={clsx(
                'p-2 bg-white bg-opacity-50 rounded-lg',
                (hasUsedAbility || (needsSwordsmith && !canAssassinate)) && 'opacity-50'
              )}
              disabled={role.type === 'GATEKEEPER' && hasUsedAbility}
            >
              ⚡
            </button>
          )}
        </div>
      </div>

      {/* Role Info Modal */}
      <Modal isOpen={showInfo} onClose={() => setShowInfo(false)} title={`${displayRole.type} Role`}>
        <p>{getRoleInfo()}</p>
        {role.type === 'SPY' && (
          <p className="mt-4 text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
            Remember: You appear as {role.fakeRole?.team} {role.fakeRole?.type} to others!
          </p>
        )}
      </Modal>

      {/* Assassin Ability Modal */}
      <Modal isOpen={showAbility} onClose={() => setShowAbility(false)} title="ASSASSINATE">
        {needsSwordsmith && !canAssassinate ? (
          <div className="space-y-4">
            <p className="text-lg font-semibold">🔒 Locked</p>
            <p>You must visit your team's Swordsmith first before you can assassinate.</p>
            <Button fullWidth onClick={() => setShowAbility(false)}>
              CLOSE
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-semibold">⚠️ IMPORTANT ⚠️</p>
            <p>Publicly name a player in your room as the target for assassination.</p>
            <p className="font-bold">This is done VERBALLY, not in the app!</p>
            <p className="text-sm text-neutral-medium">
              Stand up and clearly announce: "I assassinate [player name]"
            </p>
            <p className="text-sm text-red-600">
              Remember: You only get ONE chance. If they're not the King, you lose!
            </p>
            <Button fullWidth onClick={() => setShowAbility(false)}>
              UNDERSTOOD
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
      >
        <div className="space-y-4">
          <p>Send to other room:</p>
          <div className="space-y-2">
            {playersInRoom.map(player => (
              <label key={player.id} className="flex items-center p-2 rounded hover:bg-neutral-light">
                <input
                  type="radio"
                  name="target"
                  value={player.id}
                  checked={selectedTarget === player.id}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="mr-3"
                />
                <span>{player.name}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-neutral-medium">This action is private.</p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowGatekeeperSelect(false);
                setSelectedTarget(null);
              }}
            >
              CANCEL
            </Button>
            <Button
              variant="primary"
              onClick={handleGatekeeperSend}
              disabled={!selectedTarget}
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
      >
        <div className="space-y-4">
          <p>Which Assassin visited you?</p>
          <div className="space-y-2">
            {playersInRoom.map(player => (
              <label key={player.id} className="flex items-center p-2 rounded hover:bg-neutral-light">
                <input
                  type="radio"
                  name="assassin"
                  value={player.id}
                  checked={selectedTarget === player.id}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="mr-3"
                />
                <span>{player.name}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-neutral-medium">This confirms they can assassinate.</p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowSwordsmithSelect(false);
                setSelectedTarget(null);
              }}
            >
              CANCEL
            </Button>
            <Button
              variant="primary"
              onClick={handleSwordsmithConfirm}
              disabled={!selectedTarget}
            >
              CONFIRM
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}