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

  // Stub use case that logs and returns - for features not yet implemented
  const stubUseCase = (name: string) => ({
    execute: async (input: any) => {
      console.warn(`[useDI] Use case '${name}' not yet implemented. Input:`, input);
    },
  });

  return useCallback(
    () => ({
      sendConnectionRequest: container.getSendConnectionRequestUseCase(),
      acceptConnectionRequest: container.getAcceptConnectionRequestUseCase(),
      blockUser: container.getBlockUserUseCase(),
      // Stub use cases for features not yet wired to infrastructure
      upgradeConnectionToRelationship: stubUseCase("upgradeConnectionToRelationship"),
      downgradeConnectionToFriend: stubUseCase("downgradeConnectionToFriend"),
      acceptUpgradeRequest: stubUseCase("acceptUpgradeRequest"),
      rejectUpgradeRequest: stubUseCase("rejectUpgradeRequest"),
      removeConnection: stubUseCase("removeConnection"),
      declineConnectionRequest: stubUseCase("declineConnectionRequest"),
      markNotificationAsRead: stubUseCase("markNotificationAsRead"),
      markAllNotificationsAsRead: stubUseCase("markAllNotificationsAsRead"),
    }),
    [container]
  );
}

/**
 * Repositories
 */

// Stub notification repository (not yet implemented in infrastructure)
const notificationRepositoryStub = {
  findByUserId: async (_userId: string): Promise<any[]> => {
    console.warn("[useDI] notificationRepository.findByUserId not yet implemented");
    return [];
  },
  markAsRead: async (_id: string): Promise<void> => {
    console.warn("[useDI] notificationRepository.markAsRead not yet implemented");
  },
  markAllAsRead: async (_userId: string): Promise<void> => {
    console.warn("[useDI] notificationRepository.markAllAsRead not yet implemented");
  },
};

// Stub chat repository (not yet implemented in infrastructure)
const chatRepositoryStub = {
  findByWishId: async (_wishId: string): Promise<any | null> => {
    console.warn("[useDI] chatRepository.findByWishId not yet implemented");
    return null;
  },
  create: async (_wishId: string, _participants: string[]): Promise<any | null> => {
    console.warn("[useDI] chatRepository.create not yet implemented");
    return null;
  },
  getMessages: async (_chatId: string): Promise<any[]> => {
    console.warn("[useDI] chatRepository.getMessages not yet implemented");
    return [];
  },
  sendMessage: async (_chatId: string, _senderId: string, _text: string): Promise<any | null> => {
    console.warn("[useDI] chatRepository.sendMessage not yet implemented");
    return null;
  },
};

export function useRepositories() {
  const container = useDIContainer();

  return useCallback(
    () => ({
      // Canonical names used by most screens
      wishRepository: container.getWishRepository(),
      wishRecipientRepository: container.getWishRecipientRepository(),
      connectionRepository: container.getConnectionRepository(),
      connectionRequestRepository: container.getConnectionRequestRepository(),
      blockedUserRepository: container.getBlockedUserRepository(),
      // Stub repositories not yet in infrastructure
      notificationRepository: notificationRepositoryStub,
      chatRepository: chatRepositoryStub,
      // Short aliases (used by MyWishesScreen, tests, useEventSubscription)
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
