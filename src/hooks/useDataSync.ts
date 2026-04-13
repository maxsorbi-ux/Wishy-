/**
 * useDataSync - Phase 4 centralized data synchronization
 * 
 * Replaces the old Zustand store sync methods (syncWishes, syncConnections, syncNotifications).
 * This hook coordinates data loading through the repository layer so all listeners
 * can access fresh data through the standard Phase 4 pattern.
 */

import { useCallback } from "react";
import { useRepositories } from "./useDI";
import useUserStore from "../state/userStore";

export function useDataSync() {
  const repositories = useRepositories()();
  const currentUser = useUserStore((s: any) => s.currentUser);

  const syncWishes = useCallback(async () => {
    if (!currentUser) {
      console.log("useDataSync.syncWishes: No current user, skipping");
      return;
    }

    console.log("=== DATA SYNC: WISHES ===");
    console.log(`Syncing wishes for user: ${currentUser.id}`);

    try {
      // Load wishes created by current user
      const myWishes = await repositories.wishRepository.findByCreatorId(currentUser.id);
      console.log(`Loaded ${myWishes.length} wishes created by me`);

      // Load wishes received by current user
      const receivedWishes = await repositories.wishRepository.findRecipientWishes(currentUser.id);
      console.log(`Loaded ${receivedWishes.length} wishes received by me`);

      console.log("=== DATA SYNC: WISHES COMPLETE ===");
    } catch (error) {
      console.error("Error syncing wishes:", error);
      throw error;
    }
  }, [currentUser, repositories.wishRepository]);

  const syncConnections = useCallback(async () => {
    if (!currentUser) {
      console.log("useDataSync.syncConnections: No current user, skipping");
      return;
    }

    console.log("=== DATA SYNC: CONNECTIONS ===");
    console.log(`Syncing connections for user: ${currentUser.id}`);

    try {
      // Load all connections for current user
      const connections = await repositories.connectionRepository.findByUserId(currentUser.id);
      console.log(`Loaded ${connections.length} connections`);

      console.log("=== DATA SYNC: CONNECTIONS COMPLETE ===");
    } catch (error) {
      console.error("Error syncing connections:", error);
      throw error;
    }
  }, [currentUser, repositories.connectionRepository]);

  const syncNotifications = useCallback(async () => {
    if (!currentUser) {
      console.log("useDataSync.syncNotifications: No current user, skipping");
      return;
    }

    console.log("=== DATA SYNC: NOTIFICATIONS ===");
    console.log(`Syncing notifications for user: ${currentUser.id}`);

    try {
      // Load notifications for current user if repo exists
      if (repositories.notificationRepository) {
        const notifications = await repositories.notificationRepository.findByUserId(currentUser.id);
        console.log(`Loaded ${notifications?.length || 0} notifications`);
      }

      console.log("=== DATA SYNC: NOTIFICATIONS COMPLETE ===");
    } catch (error) {
      console.error("Error syncing notifications:", error);
      throw error;
    }
  }, [currentUser, repositories.notificationRepository]);

  const syncAll = useCallback(async () => {
    console.log("=== DATA SYNC: ALL DATA ===");
    try {
      await Promise.all([syncWishes(), syncConnections(), syncNotifications()]);
      console.log("=== DATA SYNC: ALL DATA COMPLETE ===");
    } catch (error) {
      console.error("Error syncing all data:", error);
      throw error;
    }
  }, [syncWishes, syncConnections, syncNotifications]);

  return {
    syncWishes,
    syncConnections,
    syncNotifications,
    syncAll,
  };
}
