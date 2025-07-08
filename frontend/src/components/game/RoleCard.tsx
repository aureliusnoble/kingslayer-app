import { useState } from 'react';
import { Role } from '../../shared';
import clsx from 'clsx';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { socketService } from '../../services/socket';
import { useGameStore } from '../../stores/gameStore';
import { Crown, Swords, Shield, DoorClosed, Hammer, UserX, Bell, Info, Zap } from 'lucide-react';

interface RoleCardProps {
  role: Role;
  canAssassinate?: boolean;
  hasUsedAbility?: boolean;
}

const roleIcons: Record<string, React.ComponentType<any>> = {
  KING: Crown,
  ASSASSIN: Swords,
  GATEKEEPER: DoorClosed,
  SWORDSMITH: Hammer,
  GUARD: Shield,
  SPY: UserX,
  SERVANT: Bell
};

export default function RoleCard({ role, canAssassinate = false, hasUsedAbility = false }: RoleCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [showAbility, setShowAbility] = useState(false);
  const [showGatekeeperSelect, setShowGatekeeperSelect] = useState(false);
  const [showSwordsmithSelect, setShowSwordsmithSelect] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  
  const { gameState, getPlayersInMyRoom } = useGameStore();
  
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

  const RoleIcon = roleIcons[displayRole.type];

  return (
    <>
      <div className={clsx(
        'relative p-6 rounded-lg flex flex-col items-center space-y-4 text-center',
        displayRole.team === 'RED' ? 'role-card-medieval-red' : 'role-card-medieval-blue'
      )}>
        {/* Role Icon */}
        <div className={clsx(
          'w-20 h-20 rounded-full flex items-center justify-center',
          'bg-surface-light border-2',
          displayRole.team === 'RED' ? 'border-red-highlight' : 'border-blue-highlight'
        )}>
          <RoleIcon 
            size={40} 
            className={clsx(
              displayRole.team === 'RED' ? 'text-red-highlight' : 'text-blue-highlight'
            )} 
          />
        </div>
        
        {/* Role Name */}
        <h2 className={clsx(
          'text-2xl font-bold text-white',
          'font-display tracking-wider'
        )}>
          {displayRole.type}
        </h2>
        
        {/* Team Indicator */}
        <div className={clsx(
          'px-3 py-1 rounded-full text-sm font-semibold',
          displayRole.team === 'RED' 
            ? 'bg-red-primary text-white' 
            : 'bg-blue-primary text-white'
        )}>
          Team: {displayRole.team}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowInfo(true)}
            className={clsx(
              'p-3 rounded-lg transition-all duration-200 transform hover:scale-105',
              'bg-surface-light border border-medieval-stone-light',
              'hover:bg-medieval-stone-light hover:border-medieval-metal-gold'
            )}
            title="Role Information"
          >
            <Info size={20} className="text-white" />
          </button>
          
          {(role.type === 'ASSASSIN' || role.type === 'GATEKEEPER' || role.type === 'SWORDSMITH') && (
            <button
              onClick={handleAbilityClick}
              className={clsx(
                'p-3 rounded-lg transition-all duration-200 transform',
                'bg-surface-light border border-medieval-stone-light',
                (hasUsedAbility || (needsSwordsmith && !canAssassinate))
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 hover:bg-medieval-metal-gold hover:border-medieval-metal-gold'
              )}
              disabled={role.type === 'GATEKEEPER' && hasUsedAbility}
              title="Use Ability"
            >
              <Zap 
                size={20} 
                className={clsx(
                  (hasUsedAbility || (needsSwordsmith && !canAssassinate))
                    ? 'text-gray-400'
                    : 'text-white hover:text-surface-dark'
                )} 
              />
            </button>
          )}
        </div>
      </div>

      {/* Role Info Modal */}
      <Modal 
        isOpen={showInfo} 
        onClose={() => setShowInfo(false)} 
        title={`${displayRole.type} Role`}
        theme="medieval"
        size="medium"
      >
        <div className="space-y-3">
          <p className="text-white leading-relaxed">{getRoleInfo()}</p>
          {role.type === 'SPY' && (
            <div className="mt-4 p-3 rounded-lg bg-medieval-flame-orange bg-opacity-20 border border-medieval-flame-orange">
              <p className="text-sm text-medieval-flame-yellow font-medium">
                Remember: You appear as {role.fakeRole?.team} {role.fakeRole?.type} to others!
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Assassin Ability Modal */}
      <Modal 
        isOpen={showAbility} 
        onClose={() => setShowAbility(false)} 
        title="ASSASSINATE"
        theme="royal"
        size="medium"
      >
        {needsSwordsmith && !canAssassinate ? (
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
            {playersInRoom.map(player => (
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
            <span>Which Assassin visited you?</span>
          </div>
          <div className="space-y-2">
            {playersInRoom.map(player => (
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
          <p className="text-sm text-gray-300 italic">This confirms they can assassinate.</p>
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
    </>
  );
}