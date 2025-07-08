import Button from '../common/Button';
import clsx from 'clsx';
import { DoorOpen, AlertTriangle, CheckCircle } from 'lucide-react';

interface RoomChangeModalProps {
  isVisible: boolean;
  newRoom: 0 | 1;
  onConfirm: () => void;
  blocking?: boolean;
}

export default function RoomChangeModal({ 
  isVisible, 
  newRoom, 
  onConfirm, 
  blocking = true 
}: RoomChangeModalProps) {
  if (!isVisible) return null;

  const roomName = newRoom === 0 ? 'A' : 'B';

  return (
    <div className={clsx(
      'fixed inset-0 z-50 flex flex-col items-center justify-center p-6',
      'bg-medieval-stone-dark bg-opacity-95',
      blocking && 'backdrop-blur-sm'
    )}>
      {/* Full-screen overlay that blocks interaction */}
      <div className="absolute inset-0 bg-medieval-stone-dark opacity-80" />
      
      {/* Modal content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Warning icon and header */}
        <div className="text-center mb-8">
          <div className="mb-4 animate-pulse">
            <DoorOpen size={120} className="text-medieval-metal-gold mx-auto" />
          </div>
          <h1 className="text-4xl font-bold text-medieval-metal-gold mb-2 animate-pulse drop-shadow-lg font-display">
            YOU HAVE BEEN KICKED!
          </h1>
          <h2 className="text-2xl font-semibold text-red-highlight mb-2 drop-shadow-md">
            ROOM CHANGE REQUIRED
          </h2>
          <div className="w-24 h-1 bg-red-primary mx-auto animate-pulse"></div>
        </div>

        {/* Main content card */}
        <div className="bg-surface-medium rounded-lg p-8 shadow-2xl text-center space-y-6 border-2 border-medieval-metal-gold">
          <div>
            <p className="text-lg text-white mb-2 font-semibold">
              You have been sent to:
            </p>
            <div className="bg-red-primary bg-opacity-20 border-4 border-red-primary rounded-lg p-6">
              <p className="text-5xl font-bold text-red-highlight drop-shadow-lg">
                ROOM {roomName}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xl font-semibold text-white drop-shadow-md">
              Leave your current room immediately!
            </p>
            <p className="text-sm text-medieval-stone-light">
              You must physically move to the new room location and click OK to continue.
            </p>
          </div>

          {/* Blocking message */}
          {blocking && (
            <div className="bg-medieval-flame-orange bg-opacity-20 border-2 border-medieval-flame-orange rounded-lg p-3">
              <div className="flex items-center gap-2 justify-center">
                <AlertTriangle size={16} className="text-medieval-flame-yellow" />
                <p className="text-sm font-medium text-medieval-flame-yellow">
                  You cannot continue until you acknowledge this change
                </p>
              </div>
            </div>
          )}

          {/* OK Button - large and prominent */}
          <Button
            variant="medieval-red"
            size="large"
            fullWidth
            onClick={onConfirm}
            className="font-bold py-4 text-xl animate-pulse border-2 border-red-primary shadow-lg"
          >
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle size={20} />
              CONFIRM - I AM IN ROOM {roomName}
            </div>
          </Button>
        </div>

        {/* Bottom warning */}
        <div className="text-center mt-6">
          <p className="text-medieval-stone-light text-sm opacity-90 font-medium">
            Game will resume once all players have moved to their assigned rooms
          </p>
        </div>
      </div>
    </div>
  );
}