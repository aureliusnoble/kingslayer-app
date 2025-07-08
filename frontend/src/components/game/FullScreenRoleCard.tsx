import { Role } from '../../shared';
import clsx from 'clsx';
import Button from '../common/Button';

interface FullScreenRoleCardProps {
  role: Role;
  isVisible: boolean;
  onClose: () => void;
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

export default function FullScreenRoleCard({ role, isVisible, onClose }: FullScreenRoleCardProps) {
  if (!isVisible) return null;

  // Use true role (not fake role for spies) when showing to others
  const displayRole = role;
  const teamColor = displayRole.team === 'RED' ? 'bg-red-primary' : 'bg-blue-primary';
  const teamColorLight = displayRole.team === 'RED' ? 'bg-red-background' : 'bg-blue-background';

  return (
    <div className={clsx(
      'fixed inset-0 z-50 flex flex-col items-center justify-center p-6',
      teamColor
    )}>
      {/* Background overlay with team color */}
      <div className={clsx(
        'absolute inset-0',
        teamColor
      )} />
      
      {/* Role card content */}
      <div className={clsx(
        'relative z-10 w-full max-w-sm mx-auto text-center space-y-8',
        'text-white'
      )}>
        {/* Massive role icon */}
        <div className="text-[200px] leading-none">
          {roleIcons[displayRole.type]}
        </div>
        
        {/* Role name - large and bold */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-wider">
            {displayRole.type}
          </h1>
          <h2 className="text-4xl font-semibold">
            {displayRole.team} TEAM
          </h2>
        </div>
        
        {/* Thick team-colored border around everything */}
        <div className={clsx(
          'absolute inset-4 border-8 rounded-2xl pointer-events-none',
          displayRole.team === 'RED' ? 'border-red-background' : 'border-blue-background'
        )} />
      </div>
      
      {/* Back button at bottom */}
      <div className="relative z-10 mt-12">
        <Button
          variant="secondary"
          size="large"
          onClick={onClose}
          className="bg-white text-black border-4 border-white px-8 py-4 text-xl font-bold"
        >
          ← BACK
        </Button>
      </div>
    </div>
  );
}