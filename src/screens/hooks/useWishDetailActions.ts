/**
 * useWishDetailActions - All wish action handlers for WishDetailScreen
 * 
 * Encapsulates all the business logic actions like accepting, declining, 
 * proposing dates, fulfilling wishes, etc.
 * 
 * This separates action logic from UI rendering.
 */

import { useCallback } from "react";
import { Platform, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { Wish } from "../../types/wishy";

export function useWishDetailActions(
  wishId: string,
  wish: Wish | null,
  currentUser: any,
  useCases: any,
  connectionUseCases: any,
  showToast: any,
  navigation: any,
  // Modal state setters
  setShowDateModal: any,
  setShowDeclineModal: any,
  setShowDeleteModal: any,
  setShowRatingModal: any,
  setShowSendToModal: any,
  setShowEditDateModal: any,
  // Form state
  proposedDate: Date,
  editDate: Date,
  proposalMessage: string,
  rating: number,
  praised: boolean,
  review: string,
  selectedUserIds: string[],
  // Form setters
  setProposalMessage: any,
  setRating: any,
  setPraised: any,
  setReview: any,
  setSelectedUserIds: any
) {
  const handleAcceptWish = useCallback(async () => {
    if (!currentUser) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await useCases.acceptWish(wishId);
      showToast("Wish accepted!");
    } catch (error) {
      console.error("[WishDetailActions] Error accepting wish:", error);
      showToast("Error accepting wish", "error");
    }
  }, [wishId, useCases, currentUser, showToast]);

  const handleProposeDate = useCallback(async () => {
    if (!currentUser) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const dateStr = proposedDate.toLocaleDateString();
      const timeStr = proposedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      await useCases.proposeDate(wishId, {
        date: dateStr,
        time: timeStr,
        message: proposalMessage,
        proposedBy: currentUser.id,
      });

      const participants: string[] = [currentUser.id];
      if (wish!.creatorId === currentUser.id) {
        if (wish!.targetUserIds && wish!.targetUserIds.length > 0) {
          wish!.targetUserIds.forEach((targetId) => {
            if (!participants.includes(targetId)) {
              participants.push(targetId);
            }
          });
        } else if (wish!.targetUserId) {
          participants.push(wish!.targetUserId);
        }
      } else {
        participants.push(wish!.creatorId);
      }

      const chatId = await connectionUseCases.createChat(
        wishId,
        participants.filter(Boolean)
      );

      setShowDateModal(false);
      setProposalMessage("");
      showToast("Date proposed successfully!");
      navigation.navigate("Chat", { wishId, chatId });
    } catch (error) {
      console.error("[WishDetailActions] Error proposing date:", error);
      showToast("Error proposing date", "error");
    }
  }, [
    wishId,
    proposedDate,
    proposalMessage,
    useCases,
    connectionUseCases,
    currentUser,
    wish,
    navigation,
    showToast,
    setShowDateModal,
    setProposalMessage,
  ]);

  const handleDeclineWish = useCallback(async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await useCases.declineWish(wishId);
      setShowDeclineModal(false);
      showToast("Wish declined", "info");
      navigation.goBack();
    } catch (error) {
      console.error("[WishDetailActions] Error declining wish:", error);
      showToast("Error declining wish", "error");
    }
  }, [
    wishId,
    useCases,
    showToast,
    navigation,
    setShowDeclineModal,
  ]);

  const handleDeleteWish = useCallback(async () => {
    if (!currentUser) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const isCreator = wish!.creatorId === currentUser.id;

      if (isCreator) {
        await useCases.deleteWish(wishId);
        showToast("Wish deleted", "info");
      } else {
        await useCases.hideWishAsRecipient(wishId, currentUser.id);
        showToast("Wish removed", "info");
      }

      setShowDeleteModal(false);
      navigation.goBack();
    } catch (error) {
      console.error("[WishDetailActions] Error deleting wish:", error);
      showToast("Error deleting wish", "error");
    }
  }, [
    wishId,
    useCases,
    currentUser,
    wish,
    showToast,
    navigation,
    setShowDeleteModal,
  ]);

  const handleFulfillWish = useCallback(async () => {
    if (!currentUser) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await useCases.fulfillWish(
        wishId,
        rating,
        praised,
        review.trim(),
        currentUser.id
      );

      setShowRatingModal(false);
      setRating(0);
      setPraised(false);
      setReview("");

      showToast("Wish marked as fulfilled!");
    } catch (error) {
      console.error("[WishDetailActions] Error fulfilling wish:", error);
      showToast("Error marking wish as fulfilled", "error");
    }
  }, [
    wishId,
    useCases,
    currentUser,
    rating,
    praised,
    review,
    showToast,
    setShowRatingModal,
    setRating,
    setPraised,
    setReview,
  ]);

  const handleUpdateDate = useCallback(async () => {
    if (!currentUser) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const dateStr = editDate.toLocaleDateString();
      const timeStr = editDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      await useCases.proposeDate(wishId, {
        date: dateStr,
        time: timeStr,
        message: proposalMessage,
        proposedBy: currentUser.id,
      });

      setShowEditDateModal(false);
      setProposalMessage("");
      showToast("Date/time updated!");
    } catch (error) {
      console.error("[WishDetailActions] Error updating date:", error);
      showToast("Error updating date", "error");
    }
  }, [
    wishId,
    editDate,
    proposalMessage,
    useCases,
    currentUser,
    showToast,
    setShowEditDateModal,
    setProposalMessage,
  ]);

  const handleConfirmDate = useCallback(async () => {
    if (!currentUser) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await useCases.confirmDate(wishId, currentUser.id);
      showToast("Date confirmed!");
    } catch (error) {
      console.error("[WishDetailActions] Error confirming date:", error);
      showToast("Error confirming date", "error");
    }
  }, [wishId, useCases, currentUser, showToast]);

  const handleSendToUsers = useCallback(async () => {
    if (!currentUser || selectedUserIds.length === 0) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      for (const userId of selectedUserIds) {
        await useCases.sendWish(wishId, userId);
      }

      setShowSendToModal(false);
      setSelectedUserIds([]);

      showToast(
        `Wish sent to ${selectedUserIds.length} ${
          selectedUserIds.length === 1 ? "user" : "users"
        }!`
      );

      setTimeout(() => {
        navigation.goBack();
      }, 100);
    } catch (error) {
      console.error("[WishDetailActions] Error sending wish:", error);
      showToast("Error sending wish", "error");
    }
  }, [
    wishId,
    useCases,
    currentUser,
    selectedUserIds,
    showToast,
    navigation,
    setShowSendToModal,
    setSelectedUserIds,
  ]);

  const handleOpenMaps = useCallback(() => {
    if (!wish!.location) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const encodedLocation = encodeURIComponent(wish!.location);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedLocation}`,
      android: `geo:0,0?q=${encodedLocation}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`,
    });

    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`
      );
    });
  }, [wish]);

  const handleOpenChat = useCallback(async () => {
    if (!currentUser) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const participants: string[] = [currentUser.id];
      if (wish!.creatorId === currentUser.id) {
        if (wish!.targetUserIds && wish!.targetUserIds.length > 0) {
          wish!.targetUserIds.forEach((targetId) => {
            if (!participants.includes(targetId)) {
              participants.push(targetId);
            }
          });
        } else if (wish!.targetUserId) {
          participants.push(wish!.targetUserId);
        }
      } else {
        participants.push(wish!.creatorId);
      }

      if (participants.length >= 2) {
        const chatId = await connectionUseCases.createChat(wishId, participants);
        navigation.navigate("Chat", { wishId, chatId });
      } else {
        showToast("Cannot open chat - missing participant", "error");
      }
    } catch (error) {
      console.error("[WishDetailActions] Error opening chat:", error);
      showToast("Error opening chat", "error");
    }
  }, [
    wishId,
    currentUser,
    wish,
    connectionUseCases,
    navigation,
    showToast,
  ]);

  return {
    handleAcceptWish,
    handleProposeDate,
    handleDeclineWish,
    handleDeleteWish,
    handleFulfillWish,
    handleUpdateDate,
    handleConfirmDate,
    handleSendToUsers,
    handleOpenMaps,
    handleOpenChat,
  };
}
