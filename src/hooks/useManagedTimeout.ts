import { useCallback, useEffect, useRef } from 'react';

/**
 * Screen/game-safe timeout scheduler.
 * Every pending callback is cancelled on unmount so enter -> exit -> enter cannot
 * leave stale state/audio callbacks running in a later screen instance.
 */
export function useManagedTimeout() {
  const timersRef = useRef<Set<number>>(new Set());

  const scheduleTimeout = useCallback((callback: () => void, delayMs: number) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      callback();
    }, delayMs);
    timersRef.current.add(id);
    return id;
  }, []);

  useEffect(() => () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current.clear();
  }, []);

  return scheduleTimeout;
}
