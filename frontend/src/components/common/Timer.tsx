import { CheckCircle } from 'lucide-react';

interface TimerProps {
  seconds?: number;
  label: string;
  maxSeconds?: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'urgent' | 'medieval';
  showProgress?: boolean;
  onTimeUp?: () => void;
}

export default function Timer({ 
  seconds, 
  label, 
  maxSeconds = 300, // 5 minutes default
  size = 'medium',
  variant = 'medieval',
  showProgress = true,
  onTimeUp: _onTimeUp
}: TimerProps) {
  const formatTime = (sec?: number) => {
    if (sec === undefined || sec === null) return 'Ready';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isReady = !seconds || seconds === 0;
  const isUrgent = seconds && seconds <= 30;
  const isVeryUrgent = seconds && seconds <= 10;
  const progressPercent = seconds && maxSeconds ? (seconds / maxSeconds) * 100 : 0;

  const sizeClasses = {
    small: {
      container: 'w-16 h-16',
      text: 'text-sm',
      label: 'text-xs'
    },
    medium: {
      container: 'w-20 h-20',
      text: 'text-base',
      label: 'text-sm'
    },
    large: {
      container: 'w-24 h-24',
      text: 'text-lg',
      label: 'text-base'
    }
  };

  const getTimerColor = () => {
    if (isReady) return 'text-green-400';
    if (isVeryUrgent) return 'text-red-400';
    if (isUrgent) return 'text-orange-400';
    return 'text-medieval-parchment';
  };

  const getProgressColor = () => {
    if (isReady) return 'stroke-green-400';
    if (isVeryUrgent) return 'stroke-red-400';
    if (isUrgent) return 'stroke-orange-400';
    return 'stroke-medieval-metal-gold';
  };

  const getGlowClass = () => {
    if (isVeryUrgent) return 'animate-pulse medieval-glow';
    if (isUrgent) return 'animate-pulse';
    return '';
  };

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-2">
      <p className={`${sizeClasses[size].label} text-medieval-parchment font-display text-center`}>
        {label}
      </p>
      
      <div className={`relative ${sizeClasses[size].container} ${getGlowClass()}`}>
        {/* Background circle */}
        <svg 
          className="absolute inset-0 w-full h-full transform -rotate-90" 
          viewBox="0 0 72 72"
        >
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-medieval-stone-medium opacity-30"
          />
        </svg>
        
        {/* Progress circle */}
        {showProgress && seconds && seconds > 0 && (
          <svg 
            className="absolute inset-0 w-full h-full transform -rotate-90" 
            viewBox="0 0 72 72"
          >
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className={`${getProgressColor()} transition-all duration-300 ease-out`}
              style={{
                strokeDasharray,
                strokeDashoffset,
                filter: isVeryUrgent ? 'drop-shadow(0 0 6px currentColor)' : 'none'
              }}
            />
          </svg>
        )}
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {variant === 'medieval' && (
            <div className="text-medieval-metal-gold mb-1">
              {isReady ? '⚔️' : isVeryUrgent ? '🔥' : isUrgent ? '⚡' : '⏳'}
            </div>
          )}
          
          <div className={`font-mono font-bold ${sizeClasses[size].text} ${getTimerColor()}`}>
            {formatTime(seconds)}
          </div>
          
          {isVeryUrgent && (
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-40" />
          )}
        </div>
        
        {/* Medieval border styling */}
        {variant === 'medieval' && (
          <div className="absolute inset-0 rounded-full border-2 border-medieval-metal-gold opacity-20" />
        )}
        
        {/* Ambient particles for urgent states */}
        {isUrgent && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 w-1 h-1 bg-orange-400 rounded-full animate-ping opacity-60" />
            <div className="absolute bottom-0 right-1/2 w-1 h-1 bg-orange-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '0.5s' }} />
          </div>
        )}
        
        {isVeryUrgent && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-80" />
            <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-80" style={{ animationDelay: '0.3s' }} />
            <div className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-80" style={{ animationDelay: '0.6s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-red-400 rounded-full animate-pulse opacity-80" style={{ animationDelay: '0.9s' }} />
          </div>
        )}
      </div>
      
      {/* Status indicator */}
      {isReady && (
        <div className="flex items-center gap-1 text-green-400 text-sm font-display animate-pulse">
          <CheckCircle size={16} />
          <span>Ready</span>
        </div>
      )}
      
      {isVeryUrgent && (
        <div className="text-red-400 text-sm font-display animate-pulse">
          🚨 Urgent!
        </div>
      )}
      
      {isUrgent && !isVeryUrgent && (
        <div className="text-orange-400 text-sm font-display animate-pulse">
          ⚡ Hurry!
        </div>
      )}
    </div>
  );
}