import Button from '../common/Button';
import clsx from 'clsx';

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
      'bg-black bg-opacity-90',
      blocking && 'backdrop-blur-sm'
    )}>
      {/* Full-screen overlay that blocks interaction */}
      <div className="absolute inset-0 bg-black opacity-75" />
      
      {/* Modal content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Warning icon and header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-pulse">🚪</div>
          <h1 className="text-4xl font-bold text-white mb-2 animate-pulse">
            YOU HAVE BEEN KICKED!
          </h1>
          <h2 className="text-2xl font-semibold text-red-300 mb-2">
            ROOM CHANGE REQUIRED
          </h2>
          <div className="w-24 h-1 bg-red-500 mx-auto animate-pulse"></div>
        </div>

        {/* Main content card */}
        <div className="bg-white rounded-lg p-8 shadow-2xl text-center space-y-6">
          <div>
            <p className="text-lg text-neutral-dark mb-2">
              You have been sent to:
            </p>
            <div className="bg-red-100 border-4 border-red-500 rounded-lg p-6">
              <p className="text-5xl font-bold text-red-600">
                ROOM {roomName}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xl font-semibold text-neutral-dark">
              Leave your current room immediately!
            </p>
            <p className="text-sm text-neutral-medium">
              You must physically move to the new room location and click OK to continue.
            </p>
          </div>

          {/* Blocking message */}
          {blocking && (
            <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800">
                ⚠️ You cannot continue until you acknowledge this change
              </p>
            </div>
          )}

          {/* OK Button - large and prominent */}
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 text-xl animate-pulse"
          >
            ✓ CONFIRM - I AM IN ROOM {roomName}
          </Button>
        </div>

        {/* Bottom warning */}
        <div className="text-center mt-6">
          <p className="text-white text-sm opacity-75">
            Game will resume once all players have moved to their assigned rooms
          </p>
        </div>
      </div>
    </div>
  );
}