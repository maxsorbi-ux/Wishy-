/**
 * Hooks for accessing DI Container in React components
 *
 * These hooks provide convenient access to use cases and the event emitter
 * without needing to import DIContainer directly in every screen.
 *
 * Usage:
 *   const { sendWish } = useWishUseCases();
 *   const eventEmitter = useEventEmitter();
 */

import { useCallback, useRef, useEffect } from "react";
import { DIContainer } from "../infrastructure";
import {
  SendWishUseCase,
  AcceptWishUseCase,
  RejectWishUseCase,
  FulfillWishUseCase,
  ProposeWishDateUseCase,
  ConfirmWishDateUseCase,
  SendConnectionRequestUseCase,
  AcceptConnectionRequestUseCase,
  BlockUserUseCase,
} from "../application";
import { EventEmitter } from "../infrastructure";

/**
 * Get the global DI container instance
 */
export function useDIContainer(): DIContainer {
  return DIContainer.getInstance();
}

/**
 * Get the event emitter for subscribing to domain events
 */
export function useEventEmitter(): EventEmitter {
  const container = useDIContainer();
  return container.getEventEmitter();
}

/**
 * Wish-related use cases
 */
export function useWishUseCases() {
  const container = useDIContainer();

  return useCallback(
    () => ({
      sendWish: container.getSendWishUseCase(),
      acceptWish: container.getAcceptWishUseCase(),
      rejectWish: container.getRejectWishUseCase(),
      fulfillWish: container.getFulfillWishUseCase(),
      proposeWishDate: container.getProposeWishDateUseCase(),
      confirmWishDate: container.getConfirmWishDateUseCase(),
    }),
    [container]
  );
}

/**
 * Connection-related use cases
 */
export function useConnectionUseCases() {
  const container = useDIContainer();

  return useCallback(
    () => ({
      sendConnectionRequest: container.getSendConnectionRequestUseCase(),
      acceptConnectionRequest: container.getAcceptConnectionRequestUseCase(),
      blockUser: container.getBlockUserUseCase(),
    }),
    [container]
  );
}

/**
 * Repositories
 */
export function useRepositories() {
  const container = useDIContainer();

  return useCallback(
    () => ({
      wishes: container.getWishRepository(),
      wishRecipients: container.getWishRecipientRepository(),
      connections: container.getConnectionRepository(),
      connectionRequests: container.getConnectionRequestRepository(),
      blockedUsers: container.getBlockedUserRepository(),
    }),
    [container]
  );
}

/**
 * Subscribe to domain events with automatic cleanup
 *
 * Usage:
 *   useEventListener("wish.sent", (event) => {
 *     showToast("Wish sent!");
 *   });
 */
export function useEventListener(
  eventType: string,
  handler: (event: any) => void
): void {
  const emitter = useEventEmitter();
  const handlerRef = useRef(handler);

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Subscribe with a wrapper that always uses the latest handler
    const unsubscribe = emitter.on(eventType, (event) => {
      handlerRef.current(event);
    });

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, [emitter, eventType]);
}

/**
 * Subscribe to multiple domain events at once
 *
 * Usage:
 *   useEventListeners({
 *     "wish.sent": (event) => showToast("Sent!"),
 *     "wish.accepted": (event) => showToast("Accepted!"),
 *   });
 */
export function useEventListeners(
  eventHandlers: Record<string, (event: any) => void>
): void {
  const emitter = useEventEmitter();

  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    // Subscribe to each event type
    Object.entries(eventHandlers).forEach(([eventType, handler]) => {
      const unsubscribe = emitter.on(eventType, handler);
      unsubscribes.push(unsubscribe);
    });

    // Cleanup: unsubscribe all on unmount
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [emitter, eventHandlers]);
}
