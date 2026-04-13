/**
 * useWishDetailData - Custom hook for WishDetailScreen data management
 * 
 * Handles:
 * - Loading wish from repository
 * - Subscribing to wish events
 * - Loading connected users
 * - Deriving computed values (targets, creator, etc.)
 */

import { useState, useEffect } from "react";
import { useRepositories, useEventListeners } from "./useDI";
import useUserStore from "../state/userStore";
import { Wish, User } from "../types/wishy";

export function useWishDetailData(wishId: string) {
  const repositories = useRepositories()();
  const currentUser = useUserStore((s: any) => s.currentUser);
  const allUsers = useUserStore((s: any) => s.allUsers);

  const [wish, setWish] = useState<Wish | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial wish data
  useEffect(() => {
    const loadWish = async () => {
      try {
        setLoading(true);
        const w = await repositories.wishRepository.findById(wishId);
        setWish(w || null);
      } catch (error) {
        console.error("[useWishDetailData] Error loading wish:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWish();
  }, [wishId, repositories.wishRepository]);

  // Load connections for current user
  useEffect(() => {
    const loadConnections = async () => {
      if (!currentUser) return;
      try {
        const conns = await repositories.connectionRepository.findByUserId(currentUser.id);
        setConnections(conns);
      } catch (error) {
        console.error("[useWishDetailData] Error loading connections:", error);
      }
    };

    loadConnections();
  }, [currentUser, repositories.connectionRepository]);

  // Subscribe to wish events for real-time updates
  useEventListeners({
    "wish.sent": (event) => {
      if (event.wishId === wishId) {
        repositories.wishRepository.findById(wishId).then((w) => setWish(w || null));
      }
    },
    "wish.accepted": (event) => {
      if (event.wishId === wishId) {
        repositories.wishRepository.findById(wishId).then((w) => setWish(w || null));
      }
    },
    "wish.declined": (event) => {
      if (event.wishId === wishId) {
        // Parent component handles navigation
      }
    },
    "wish.deleted": (event) => {
      if (event.wishId === wishId) {
        // Parent component handles navigation
      }
    },
    "wish.dateProposed": (event) => {
      if (event.wishId === wishId) {
        repositories.wishRepository.findById(wishId).then((w) => setWish(w || null));
      }
    },
    "wish.dateConfirmed": (event) => {
      if (event.wishId === wishId) {
        repositories.wishRepository.findById(wishId).then((w) => setWish(w || null));
      }
    },
    "wish.fulfilled": (event) => {
      if (event.wishId === wishId) {
        repositories.wishRepository.findById(wishId).then((w) => setWish(w || null));
      }
    },
  });

  // Compute connected users filtered by role
  const connectedUsers = wish && currentUser ? 
    (() => {
      const connectedUserIds = connections.map((conn) =>
        conn.senderId === currentUser.id ? conn.receiverId : conn.senderId
      );

      return allUsers.filter((user) => {
        if (!connectedUserIds.includes(user.id)) return false;
        if (wish.creatorRole === "wisher") {
          return user.role === "wished" || user.role === "both";
        } else if (wish.creatorRole === "wished") {
          return user.role === "wisher" || user.role === "both";
        }
        return true;
      });
    })()
    : [];

  // Compute target users
  const targets = wish && wish.targetUserIds
    ? wish.targetUserIds
        .map((userId) => allUsers.find((u) => u.id === userId))
        .filter((user): user is User => user !== undefined)
    : [];

  // Compute user roles
  const isOwnWish = wish && wish.creatorId === currentUser?.id;
  const creator = wish ? allUsers.find((u) => u.id === wish.creatorId) : undefined;
  const isWished = wish?.creatorRole === "wished";

  const canSendToUser =
    isOwnWish &&
    (!wish || !wish.targetUserIds || wish.targetUserIds.length === 0) &&
    wish?.status === "created";

  return {
    wish,
    loading,
    connections,
    connectedUsers,
    targets,
    isOwnWish,
    creator,
    isWished,
    canSendToUser,
  };
}
