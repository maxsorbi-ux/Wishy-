/**
 * useWishDetailComputed - Computed values for WishDetailScreen
 * 
 * Handles all derived/computed data like filtered users, role checks, etc.
 * Separates presentation logic from action logic.
 */

import React from "react";
import { User, Wish } from "../types/wishy";

export function useWishDetailComputed(
  wish: Wish | null,
  currentUser: User | null,
  allUsers: User[],
  connections: any[]
) {
  // Connected users filtered by role
  const connectedUsers = React.useMemo(() => {
    if (!currentUser || !wish) return [];
    const connectedUserIds = connections.map((conn) =>
      conn.senderId === currentUser.id ? conn.receiverId : conn.senderId
    );

    const filteredUsers = allUsers.filter((user) => {
      if (!connectedUserIds.includes(user.id)) return false;
      if (wish.creatorRole === "wisher") {
        return user.role === "wished" || user.role === "both";
      } else if (wish.creatorRole === "wished") {
        return user.role === "wisher" || user.role === "both";
      }
      return true;
    });

    return filteredUsers;
  }, [currentUser, wish, allUsers, connections]);

  // Target users
  const targets = React.useMemo(() => {
    if (!wish || !wish.targetUserIds || wish.targetUserIds.length === 0)
      return [];
    return wish.targetUserIds
      .map((userId) => allUsers.find((u) => u.id === userId))
      .filter((user): user is User => user !== undefined);
  }, [wish, allUsers]);

  // User role information
  const isOwnWish = wish && wish.creatorId === currentUser?.id;
  const creator = wish && allUsers.find((u) => u.id === wish.creatorId);
  const target = wish && wish.targetUserId
    ? allUsers.find((u) => u.id === wish.targetUserId)
    : undefined;
  const isWished = wish?.creatorRole === "wished";

  const canSendToUser =
    isOwnWish &&
    (!wish.targetUserIds || wish.targetUserIds.length === 0) &&
    !wish.targetUserId &&
    wish.status === "created";

  return {
    connectedUsers,
    targets,
    isOwnWish,
    creator,
    target,
    isWished,
    canSendToUser,
  };
}
