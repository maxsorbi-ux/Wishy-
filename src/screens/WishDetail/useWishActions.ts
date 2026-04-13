/**
 * useWishActions - Custom hook for WishDetailScreen business logic
 * 
 * Handles:
 * - Accept wish
 * - Propose date
 * - Confirm date
 * - Decline wish
 * - Fulfill wish
 * - Delete wish
 * - Send to users
 * - Update date
 */

import { useCallback, useState } from "react";
import { useWishUseCases, useConnectionUseCases } from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { useToastStore } from "../state/toastStore";
import { Wish } from "../types/wishy";
import * as Haptics from "expo-haptics";
import {
  sendDateProposedNotification,
  sendWishReceivedNotification,
} from "../api/pushNotifications";

export function useWishActions(wish: Wish | null) {
  const useCases = useWishUseCases()();
  const connectionUseCases = useConnectionUseCases()();
  const showToast = useToastStore((s: any) => s.showToast);
  const currentUser = useUserStore((s: any) => s.currentUser);

  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const acceptWish = useCallback(async () => {
    if (!currentUser || !wish) return;
    try {
      setIsLoadingAction(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await useCases.acceptWish(wish.id);
      showToast("Wish accepted!");
    } catch (error) {
      console.error("[useWishActions] Error accepting wish:", error);
      showToast("Error accepting wish", "error");
    } finally {
      setIsLoadingAction(false);
    }
  }, [wish, useCases, currentUser, showToast]);

  const proposeDate = useCallback(
    async (proposedDate: Date, proposedTime: string, message: string) => {
      if (!currentUser || !wish) return;
      try {
        setIsLoadingAction(true);
        await useCases.proposeDate(wish.id, {
          date: proposedDate.toISOString().split("T")[0],
          time: proposedTime,
          message,
          proposedBy: currentUser.id,
        });

        // Send notification
        sendDateProposedNotification(wish.id, currentUser.name || "User");

        showToast("Date proposed!");
      } catch (error) {
        console.error("[useWishActions] Error proposing date:", error);
        showToast("Error proposing date", "error");
      } finally {
        setIsLoadingAction(false);
      }
    },
    [wish, useCases, currentUser, showToast]
  );

  const confirmDate = useCallback(async () => {
    if (!currentUser || !wish) return;
    try {
      setIsLoadingAction(true);
      await useCases.confirmDate(wish.id, currentUser.id);
      showToast("Date confirmed!");
    } catch (error) {
      console.error("[useWishActions] Error confirming date:", error);
      showToast("Error confirming date", "error");
    } finally {
      setIsLoadingAction(false);
    }
  }, [wish, useCases, currentUser, showToast]);

  const declineWish = useCallback(async () => {
    if (!currentUser || !wish) return;
    try {
      setIsLoadingAction(true);
      await useCases.declineWish(wish.id);
      showToast("Wish declined");
    } catch (error) {
      console.error("[useWishActions] Error declining wish:", error);
      showToast("Error declining wish", "error");
    } finally {
      setIsLoadingAction(false);
    }
  }, [wish, useCases, currentUser, showToast]);

  const deleteWish = useCallback(async () => {
    if (!currentUser || !wish) return;
    try {
      setIsLoadingAction(true);
      await useCases.deleteWish(wish.id);
      showToast("Wish deleted");
    } catch (error) {
      console.error("[useWishActions] Error deleting wish:", error);
      showToast("Error deleting wish", "error");
    } finally {
      setIsLoadingAction(false);
    }
  }, [wish, useCases, currentUser, showToast]);

  const fulfillWish = useCallback(
    async (rating: number, praised: boolean, review: string) => {
      if (!currentUser || !wish) return;
      try {
        setIsLoadingAction(true);
        await useCases.fulfillWish(wish.id, {
          rating,
          praised,
          review,
          fulfilledBy: currentUser.id,
        });
        showToast("Wish fulfilled!");
      } catch (error) {
        console.error("[useWishActions] Error fulfilling wish:", error);
        showToast("Error fulfilling wish", "error");
      } finally {
        setIsLoadingAction(false);
      }
    },
    [wish, useCases, currentUser, showToast]
  );

  const updateDate = useCallback(
    async (newDate: Date, newTime: string) => {
      if (!currentUser || !wish) return;
      try {
        setIsLoadingAction(true);
        await useCases.proposeDate(wish.id, {
          date: newDate.toISOString().split("T")[0],
          time: newTime,
          proposedBy: currentUser.id,
        });
        showToast("Date updated!");
      } catch (error) {
        console.error("[useWishActions] Error updating date:", error);
        showToast("Error updating date", "error");
      } finally {
        setIsLoadingAction(false);
      }
    },
    [wish, useCases, currentUser, showToast]
  );

  const sendToUsers = useCallback(
    async (userIds: string[]) => {
      if (!currentUser || !wish || userIds.length === 0) return;
      try {
        setIsLoadingAction(true);
        for (const userId of userIds) {
          // Send notification to each user
          sendWishReceivedNotification(wish.id, wish.title, currentUser.name || "User");
        }
        showToast("Wish sent to users!");
      } catch (error) {
        console.error("[useWishActions] Error sending wish:", error);
        showToast("Error sending wish", "error");
      } finally {
        setIsLoadingAction(false);
      }
    },
    [wish, currentUser, showToast]
  );

  return {
    isLoadingAction,
    acceptWish,
    proposeDate,
    confirmDate,
    declineWish,
    deleteWish,
    fulfillWish,
    updateDate,
    sendToUsers,
  };
}
