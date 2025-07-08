import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export function useTimer() {
  const { updateLiveTimers } = useGameStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateLiveTimers();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateLiveTimers]);
}