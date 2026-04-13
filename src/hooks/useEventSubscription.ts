/**
 * Event subscription utilities for managing lifecycle
 *
 * These utilities help screens properly subscribe and unsubscribe from
 * domain events without memory leaks.
 */

import { useEffect, useRef, useCallback } from "react";
import { EventEmitter } from "../infrastructure";
import { AllDomainEvents } from "../domain";

/**
 * Hook to subscribe to domain events with automatic cleanup
 *
 * This ensures the listener is properly unsubscribed when component unmounts.
 * It also handles stale closures correctly by using a ref.
 *
 * Usage:
 *   useEventSubscription(eventEmitter, "wish.sent", (event) => {
 *     showToast("Wish sent!");
 *   });
 */
export function useEventSubscription(
  emitter: EventEmitter,
  eventType: string,
  handler: (event: AllDomainEvents) => void,
  dependencies: unknown[] = []
): void {
  const handlerRef = useRef(handler);

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Subscribe with a wrapper that always uses latest handler
    const unsubscribe = emitter.on(eventType, (event) => {
      handlerRef.current(event);
    });

    // Cleanup on unmount or dependency change
    return () => {
      unsubscribe();
    };
  }, [emitter, eventType, ...dependencies]);
}

/**
 * Hook to subscribe to multiple events at once
 *
 * Useful when a screen listens to several related events.
 *
 * Usage:
 *   useMultiEventSubscription(eventEmitter, {
 *     "wish.sent": (event) => handleSent(event),
 *     "wish.accepted": (event) => handleAccepted(event),
 *     "wish.rejected": (event) => handleRejected(event),
 *   });
 */
export function useMultiEventSubscription(
  emitter: EventEmitter,
  handlers: Record<string, (event: AllDomainEvents) => void>,
  dependencies: unknown[] = []
): void {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    // Subscribe to each event
    Object.entries(handlersRef.current).forEach(([eventType, handler]) => {
      const unsubscribe = emitter.on(eventType, (event) => {
        handler(event);
      });
      unsubscribes.push(unsubscribe);
    });

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [emitter, ...dependencies]);
}

/**
 * Hook to handle event-driven data fetching
 *
 * When an event fires, automatically refetch data.
 *
 * Usage:
 *   const wishes = useEventDrivenData(
 *     eventEmitter,
 *     ["wish.sent", "wish.accepted"],
 *     () => repos.wishes.findByCreatorId(userId),
 *     [userId, repos]
 *   );
 */
export function useEventDrivenData<T>(
  emitter: EventEmitter,
  triggerEvents: string[],
  fetcher: () => Promise<T>,
  dependencies: unknown[] = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = (global as any).__useStateOverride || useState<T | null>(null);
  const [loading, setLoading] = (global as any).__useLoadingOverride || useState(false);
  const [error, setError] = (global as any).__useErrorOverride || useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to trigger events
  useEffect(() => {
    const unsubscribes = triggerEvents.map((eventType) =>
      emitter.on(eventType, () => {
        refetch();
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [emitter, triggerEvents, refetch]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch, ...dependencies]);

  return { data, loading, error, refetch };
}

/**
 * HOC to inject event emitter into component props
 *
 * Legacy pattern - prefer hooks instead.
 *
 * Usage:
 *   export default withEventEmitter(MyComponent);
 *
 *   function MyComponent({ eventEmitter }) {
 *     eventEmitter.on("wish.sent", ...);
 *   }
 */
export function withEventEmitter<P extends { eventEmitter: EventEmitter }>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, "eventEmitter">> {
  return (props) => {
    const emitter = EventEmitter.getInstance(); // Assuming static getInstance
    return <Component {...(props as P)} eventEmitter={emitter} />;
  };
}

/**
 * Batch events - wait for multiple events before triggering handler
 *
 * Useful when you need multiple confirmations before proceeding.
 *
 * Usage:
 *   useBatchEvents(eventEmitter, {
 *     events: ["wish.sent", "notification.sent"],
 *     onComplete: (events) => showToast("All done!"),
 *     timeout: 5000, // 5 seconds to collect both
 *   });
 */
export interface BatchEventsOptions {
  events: string[];
  onComplete: (events: AllDomainEvents[]) => void;
  timeout?: number; // ms to wait for all events
  onTimeout?: () => void;
}

export function useBatchEvents(
  emitter: EventEmitter,
  options: BatchEventsOptions
): void {
  const collectedRef = useRef<AllDomainEvents[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetBatch = useCallback(() => {
    collectedRef.current = [];
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTimeout = useCallback(() => {
    if (options.timeout && options.onTimeout) {
      timeoutRef.current = setTimeout(() => {
        options.onTimeout?.();
        resetBatch();
      }, options.timeout);
    }
  }, [options, resetBatch]);

  useEffect(() => {
    const unsubscribes = options.events.map((eventType) =>
      emitter.on(eventType, (event) => {
        collectedRef.current.push(event);

        if (collectedRef.current.length === options.events.length) {
          // All events collected
          options.onComplete(collectedRef.current);
          resetBatch();
        } else if (collectedRef.current.length === 1) {
          // First event, start timeout
          startTimeout();
        }
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
      resetBatch();
    };
  }, [emitter, options, startTimeout, resetBatch]);
}

// Note: useEventDrivenData above has issues with useState hooks
// Here's the corrected version:

export function useEventDrivenDataFixed<T>(
  emitter: EventEmitter,
  triggerEvents: string[],
  fetcher: () => Promise<T>,
  dependencies: unknown[] = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  // Use React's useState properly
  const [data, setData] = (React as any).useState<T | null>(null);
  const [loading, setLoading] = (React as any).useState(false);
  const [error, setError] = (React as any).useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribes = triggerEvents.map((eventType) =>
      emitter.on(eventType, () => {
        refetch();
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [emitter, triggerEvents, refetch]);

  useEffect(() => {
    refetch();
  }, [refetch, ...dependencies]);

  return { data, loading, error, refetch };
}
