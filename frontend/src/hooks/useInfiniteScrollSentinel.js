import { useEffect, useRef } from 'react';

/**
 * Returns a ref to attach to a sentinel element at the end of a list. Calls
 * `onIntersect` once it scrolls near the viewport, so callers can trigger
 * `fetchNextPage()` from a TanStack `useInfiniteQuery`.
 */
export const useInfiniteScrollSentinel = (onIntersect, { enabled = true, rootMargin = '300px' } = {}) => {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;

  useEffect(() => {
    if (!enabled) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) callbackRef.current();
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
};
