interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'shield' | 'sword' | 'crown' | 'ember';
  showProgress?: boolean;
  progress?: number;
}

const medievalMessages = [
  'Forging the realm...',
  'Gathering the court...',
  'Preparing the throne...',
  'Assembling the knights...',
  'Lighting the torches...',
  'Opening the gates...',
  'Sharpening the blades...',
  'Polishing the crown...',
];

export default function Loading({ 
  message, 
  size = 'medium', 
  variant = 'shield',
  showProgress = false,
  progress = 0
}: LoadingProps) {
  const getRandomMedievalMessage = () => {
    return medievalMessages[Math.floor(Math.random() * medievalMessages.length)];
  };

  const displayMessage = message || getRandomMedievalMessage();

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const renderSpinner = () => {
    const baseClasses = `${sizeClasses[size]} relative`;
    
    switch (variant) {
      case 'shield':
        return (
          <div className={`${baseClasses} animate-spin`}>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-medieval-metal-gold border-r-medieval-metal-copper opacity-80" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-medieval-flame-yellow border-r-medieval-flame-orange opacity-60" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-medieval-metal-gold/20 to-medieval-metal-copper/20 medieval-glow" />
          </div>
        );
      
      case 'sword':
        return (
          <div className={`${baseClasses} animate-spin`}>
            <div className="absolute inset-0 bg-gradient-to-br from-medieval-metal-gold to-medieval-metal-copper rounded-full opacity-80" />
            <div className="absolute inset-1 bg-gradient-to-br from-medieval-stone-dark to-medieval-stone-medium rounded-full" />
            <div className="absolute inset-0 rounded-full medieval-glow" />
          </div>
        );
      
      case 'crown':
        return (
          <div className={`${baseClasses} animate-crown-pulse`}>
            <div className="absolute inset-0 rounded-full border-4 border-medieval-metal-gold bg-gradient-to-br from-medieval-flame-yellow/30 to-medieval-metal-copper/30" />
            <div className="absolute inset-2 rounded-full border-2 border-medieval-flame-orange bg-gradient-to-br from-medieval-metal-gold/20 to-transparent" />
            <div className="absolute inset-0 rounded-full medieval-sparkle" />
          </div>
        );
      
      case 'ember':
        return (
          <div className={`${baseClasses} relative`}>
            <div className="absolute inset-0 animate-spin">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-medieval-flame-orange border-r-medieval-flame-yellow opacity-80" />
            </div>
            <div className="absolute inset-1 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-medieval-flame-yellow border-r-medieval-flame-orange opacity-60" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-medieval-flame-yellow/30 to-medieval-flame-orange/30 animate-pulse" />
          </div>
        );
      
      default:
        return (
          <div className={`${baseClasses} animate-spin`}>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-medieval-metal-gold border-r-medieval-metal-copper opacity-80" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-medieval-flame-yellow border-r-medieval-flame-orange opacity-60" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {renderSpinner()}
      
      <p className={`mt-4 text-medieval-parchment font-display ${textSizeClasses[size]} text-center`}>
        {displayMessage}
      </p>
      
      {showProgress && (
        <div className="mt-4 w-48 h-2 bg-medieval-stone-dark rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-medieval-metal-gold to-medieval-flame-yellow transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      
      <div className="absolute inset-0 pointer-events-none">
        {/* Ambient particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-medieval-flame-yellow rounded-full animate-pulse opacity-40" />
        <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-medieval-metal-gold rounded-full animate-ping opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-medieval-flame-orange rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-0.5 h-0.5 bg-medieval-metal-copper rounded-full animate-ping opacity-30" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
}