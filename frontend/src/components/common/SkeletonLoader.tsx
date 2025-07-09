import { ReactNode } from 'react';

interface SkeletonLoaderProps {
  children?: ReactNode;
  className?: string;
  variant?: 'player' | 'role-card' | 'game-info' | 'text' | 'button' | 'list' | 'custom';
  count?: number;
  showShimmer?: boolean;
}

export default function SkeletonLoader({
  children,
  className = '',
  variant = 'custom',
  count = 1,
  showShimmer = true
}: SkeletonLoaderProps) {
  const shimmerClasses = showShimmer 
    ? 'animate-pulse bg-gradient-to-r from-medieval-stone-dark via-medieval-stone-medium to-medieval-stone-dark bg-[length:200%_100%] animate-shimmer'
    : 'bg-medieval-stone-dark';

  const renderSkeleton = () => {
    switch (variant) {
      case 'player':
        return (
          <div className={`p-4 rounded-lg border-2 border-medieval-stone-medium ${shimmerClasses}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-medieval-stone-medium" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-medieval-stone-medium rounded w-24" />
                <div className="h-3 bg-medieval-stone-medium rounded w-16" />
              </div>
              <div className="w-6 h-6 bg-medieval-stone-medium rounded" />
            </div>
          </div>
        );
        
      case 'role-card':
        return (
          <div className={`p-6 rounded-lg border-8 border-medieval-stone-medium ${shimmerClasses}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-medieval-stone-medium rounded w-32" />
                <div className="w-8 h-8 bg-medieval-stone-medium rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-medieval-stone-medium rounded w-full" />
                <div className="h-4 bg-medieval-stone-medium rounded w-3/4" />
                <div className="h-4 bg-medieval-stone-medium rounded w-1/2" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 bg-medieval-stone-medium rounded w-24" />
                <div className="h-10 bg-medieval-stone-medium rounded w-24" />
              </div>
            </div>
          </div>
        );
        
      case 'game-info':
        return (
          <div className={`p-4 rounded-lg border-2 border-medieval-stone-medium ${shimmerClasses}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-medieval-stone-medium rounded w-20" />
                <div className="h-5 bg-medieval-stone-medium rounded w-16" />
              </div>
              <div className="h-8 bg-medieval-stone-medium rounded w-full" />
              <div className="flex gap-2">
                <div className="h-6 bg-medieval-stone-medium rounded w-12" />
                <div className="h-6 bg-medieval-stone-medium rounded w-12" />
                <div className="h-6 bg-medieval-stone-medium rounded w-12" />
              </div>
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-2">
            <div className={`h-4 ${shimmerClasses} rounded w-full`} />
            <div className={`h-4 ${shimmerClasses} rounded w-3/4`} />
            <div className={`h-4 ${shimmerClasses} rounded w-1/2`} />
          </div>
        );
        
      case 'button':
        return (
          <div className={`h-12 ${shimmerClasses} rounded-lg w-full`} />
        );
        
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className={`p-3 rounded-lg border border-medieval-stone-medium ${shimmerClasses}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-medieval-stone-medium rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-medieval-stone-medium rounded w-3/4" />
                    <div className="h-3 bg-medieval-stone-medium rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'custom':
        return children || (
          <div className={`${shimmerClasses} rounded ${className}`} />
        );
        
      default:
        return (
          <div className={`${shimmerClasses} rounded ${className}`} />
        );
    }
  };

  return (
    <div className={`${className} ${showShimmer ? 'animate-pulse' : ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={count > 1 ? 'mb-4 last:mb-0' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}

// Specific skeleton components for common use cases
export function PlayerListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonLoader key={index} variant="player" />
      ))}
    </div>
  );
}

export function RoleCardSkeleton() {
  return <SkeletonLoader variant="role-card" />;
}

export function GameInfoSkeleton() {
  return <SkeletonLoader variant="game-info" />;
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-medieval-stone-dark animate-pulse rounded"
          style={{
            width: index === lines - 1 ? '60%' : index === 0 ? '100%' : '80%'
          }}
        />
      ))}
    </div>
  );
}

export function ButtonSkeleton() {
  return <SkeletonLoader variant="button" />;
}

// Medieval-themed skeleton wrapper
export function MedievalSkeleton({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      
      {/* Medieval border accent */}
      <div className="absolute inset-0 rounded-lg border border-medieval-metal-gold opacity-10 pointer-events-none" />
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-medieval-metal-gold/5 via-transparent to-medieval-metal-copper/5 pointer-events-none" />
      
      {/* Torch-like glow particles */}
      <div className="absolute top-2 right-2 w-1 h-1 bg-medieval-flame-yellow rounded-full animate-pulse opacity-30" />
      <div className="absolute bottom-2 left-2 w-1 h-1 bg-medieval-flame-orange rounded-full animate-pulse opacity-30" style={{ animationDelay: '1s' }} />
    </div>
  );
}