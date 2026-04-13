/**
 * useUserProfileComputed - Extracted computed values from UserProfileScreen
 *
 * All the useMemo computations for wish filtering, statistics,
 * and relationship data.
 */

import { useMemo } from "react";

interface UserProfileComputedParams {
  wishes: any[];
  connections: any[];
  allUsers: any[];
  currentUser: any;
  user: any;
  selectedFilter: string;
}

export function useUserProfileComputed(params: UserProfileComputedParams) {
  const { wishes, connections, allUsers, currentUser, user, selectedFilter } = params;

  // Check if users are connected
  const isConnected = useMemo(() => {
    if (!currentUser || !user) return false;
    return connections.some(
      (conn: any) => conn.senderId === user.id || conn.receiverId === user.id
    );
  }, [currentUser, user, connections]);

  // Get all wishes between me and this user (bidirectional)
  const wishesBetweenUs = useMemo(() => {
    if (!currentUser || !user) return [];
    return wishes.filter((wish: any) => {
      const isCreatedByMe = wish.creatorId === currentUser.id;
      const isCreatedByThem = wish.creatorId === user.id;
      const targetsMe =
        wish.targetUserId === currentUser.id ||
        (wish.targetUserIds && wish.targetUserIds.includes(currentUser.id));
      const targetsThem =
        wish.targetUserId === user.id ||
        (wish.targetUserIds && wish.targetUserIds.includes(user.id));
      const isBetweenUs =
        (isCreatedByMe && targetsThem) || (isCreatedByThem && targetsMe);
      return isBetweenUs;
    });
  }, [wishes, currentUser, user]);

  // Get wishes shared with me by this user
  const wishesSharedWithMe = useMemo(() => {
    if (!currentUser || !user) return [];
    return wishes.filter(
      (wish: any) =>
        wish.creatorId === user.id &&
        (wish.targetUserId === currentUser.id ||
          (wish.targetUserIds && wish.targetUserIds.includes(currentUser.id)))
    );
  }, [wishes, currentUser, user]);

  // Get user's wishlist
  const userWishlist = useMemo(() => {
    if (!user) return [];
    return wishes.filter(
      (wish: any) =>
        wish.creatorId === user.id &&
        wish.creatorRole === "wished" &&
        (wish.visibility === "public" ||
          (currentUser && wish.targetUserId === currentUser.id))
    );
  }, [wishes, user, currentUser]);

  // Get user's portfolio
  const userPortfolio = useMemo(() => {
    if (!user) return [];
    return wishes.filter(
      (wish: any) =>
        wish.creatorId === user.id &&
        wish.creatorRole === "wisher" &&
        (wish.visibility === "public" ||
          (currentUser && wish.targetUserId === currentUser.id))
    );
  }, [wishes, user, currentUser]);

  // Get user rating statistics
  const userRating = useMemo(() => {
    if (!user) return { average: 0, praised: 0, total: 0 };
    const userWishes = wishes.filter(
      (w: any) => w.creatorId === user.id && w.status === "fulfilled"
    );
    const praised = userWishes.filter(
      (w: any) => (w.ratings || []).length > 0
    ).length;
    const avgRating =
      userWishes.length > 0
        ? userWishes.reduce((sum: number, w: any) => {
            const ratings = w.ratings || [];
            return (
              sum +
              (ratings.length > 0
                ? ratings.reduce((a: number, b: number) => a + b, 0) /
                  ratings.length
                : 0)
            );
          }, 0) / userWishes.length
        : 0;
    return { average: avgRating, praised, total: userWishes.length };
  }, [wishes, user]);

  // Get user's relationship connections
  const userRelationships = useMemo(() => {
    if (!user) return [];
    const userConnections = connections.filter(
      (conn: any) =>
        (conn.senderId === user.id || conn.receiverId === user.id) &&
        conn.type === "relationship"
    );
    return userConnections
      .map((conn: any) => {
        const friendId =
          conn.senderId === user.id ? conn.receiverId : conn.senderId;
        const friend = allUsers.find((u: any) => u.id === friendId);
        return { connection: conn, user: friend };
      })
      .filter((item: any) => item.user !== undefined);
  }, [user, connections, allUsers]);

  // Calculate statistics from all wishes between us
  const statistics = useMemo(() => {
    const proposed = wishesBetweenUs.filter(
      (w: any) => w.status === "sent"
    ).length;
    const acceptedPending = wishesBetweenUs.filter(
      (w: any) =>
        w.status === "accepted" ||
        w.status === "date_set" ||
        w.status === "confirmed"
    ).length;
    const completed = wishesBetweenUs.filter(
      (w: any) => w.status === "fulfilled"
    ).length;
    const declined = wishesBetweenUs.filter(
      (w: any) => w.status === "rejected"
    ).length;
    return {
      proposed,
      acceptedPending,
      completed,
      declined,
      total: wishesBetweenUs.length,
    };
  }, [wishesBetweenUs]);

  // Get filtered wishes based on selected filter
  const filteredWishes = useMemo(() => {
    if (selectedFilter === "all") return wishesBetweenUs;
    if (selectedFilter === "sent") {
      return wishesBetweenUs.filter((w: any) => w.status === "sent");
    }
    if (selectedFilter === "accepted_pending") {
      return wishesBetweenUs.filter(
        (w: any) =>
          w.status === "accepted" ||
          w.status === "date_set" ||
          w.status === "confirmed"
      );
    }
    if (selectedFilter === "fulfilled") {
      return wishesBetweenUs.filter((w: any) => w.status === "fulfilled");
    }
    if (selectedFilter === "rejected") {
      return wishesBetweenUs.filter((w: any) => w.status === "rejected");
    }
    return wishesBetweenUs;
  }, [wishesBetweenUs, selectedFilter]);

  return {
    isConnected,
    wishesBetweenUs,
    wishesSharedWithMe,
    userWishlist,
    userPortfolio,
    userRating,
    userRelationships,
    statistics,
    filteredWishes,
  };
}
