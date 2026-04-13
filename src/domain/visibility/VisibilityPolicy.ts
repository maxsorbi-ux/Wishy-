/**
 * VisibilityPolicy - Centralized permission and visibility rules
 *
 * All visibility checks go through this policy. This is the single source of truth
 * for who can see what.
 */

import { Wish } from "../wishes/Wish";
import { Connection } from "../connections/Connection";

export interface ViewerContext {
  userId: string;
  isAuthenticated: boolean;
  roles: string[]; // "user", "admin", etc.
}

export interface VisibilityContext {
  viewer: ViewerContext;
  resource: {
    ownerId?: string;
    visibility?: "private" | "connections" | "public";
    type: "wish" | "profile" | "gallery";
  };
  relationships?: {
    isConnected?: boolean;
    isBlocked?: boolean;
    isRelationship?: boolean;
  };
}

export class VisibilityPolicy {
  /**
   * Can viewer see this wish?
   */
  static canViewWish(
    wish: Wish,
    viewerContext: ViewerContext,
    userConnections: Connection[],
    blockedByViewerIds: string[]
  ): boolean {
    // Owner can always see their own wish
    if (wish.creatorId === viewerContext.userId) {
      return true;
    }

    // Public wishes are visible to authenticated users
    if (wish.visibility === "public" && viewerContext.isAuthenticated) {
      return true;
    }

    // Private wishes only visible to creator
    if (wish.visibility === "private") {
      return false;
    }

    // Connection-only wishes require active connection
    if (wish.visibility === "connections") {
      const isConnected = userConnections.some(
        (conn) =>
          (conn.user1Id === viewerContext.userId && conn.user2Id === wish.creatorId) ||
          (conn.user2Id === viewerContext.userId && conn.user1Id === wish.creatorId)
      );

      if (!isConnected) {
        return false;
      }
    }

    // Check if viewer is blocked by wish creator
    if (blockedByViewerIds.includes(wish.creatorId)) {
      return false;
    }

    return true;
  }

  /**
   * Can viewer edit this wish?
   */
  static canEditWish(wish: Wish, viewerContext: ViewerContext): boolean {
    // Only creator can edit
    if (wish.creatorId !== viewerContext.userId) {
      return false;
    }

    // Only drafts can be edited
    return wish.status === "draft";
  }

  /**
   * Can viewer delete this wish?
   */
  static canDeleteWish(wish: Wish, viewerContext: ViewerContext): boolean {
    // Only creator can delete
    return wish.creatorId === viewerContext.userId;
  }

  /**
   * Can viewer view another user's profile?
   */
  static canViewProfile(
    profileOwnerId: string,
    viewerContext: ViewerContext,
    userConnections: Connection[],
    blockedByViewerIds: string[]
  ): boolean {
    // Can view own profile
    if (profileOwnerId === viewerContext.userId) {
      return true;
    }

    // Cannot view blocked user's profile
    if (blockedByViewerIds.includes(profileOwnerId)) {
      return false;
    }

    // Can view connected user's profile
    const isConnected = userConnections.some(
      (conn) =>
        (conn.user1Id === viewerContext.userId && conn.user2Id === profileOwnerId) ||
        (conn.user2Id === viewerContext.userId && conn.user1Id === profileOwnerId)
    );

    if (isConnected) {
      return true;
    }

    // TODO: Handle public profiles, premium features, etc.
    return false;
  }

  /**
   * Can viewer access another user's gallery?
   */
  static canViewGallery(
    galleryOwnerId: string,
    viewerContext: ViewerContext,
    userConnections: Connection[],
    blockedByViewerIds: string[],
    privacySetting: "private" | "connections" | "public" = "connections"
  ): boolean {
    // Can view own gallery
    if (galleryOwnerId === viewerContext.userId) {
      return true;
    }

    // Cannot view blocked user's gallery
    if (blockedByViewerIds.includes(galleryOwnerId)) {
      return false;
    }

    // Public gallery
    if (privacySetting === "public") {
      return viewerContext.isAuthenticated;
    }

    // Private gallery
    if (privacySetting === "private") {
      return false;
    }

    // Connections-only gallery
    const isConnected = userConnections.some(
      (conn) =>
        (conn.user1Id === viewerContext.userId && conn.user2Id === galleryOwnerId) ||
        (conn.user2Id === viewerContext.userId && conn.user1Id === galleryOwnerId)
    );

    return isConnected;
  }

  /**
   * Can viewer accept this wish as a recipient?
   */
  static canAcceptWish(
    wish: Wish,
    viewerContext: ViewerContext,
    isRecipient: boolean
  ): boolean {
    // Must be a recipient
    if (!isRecipient) {
      return false;
    }

    // Can only accept sent wishes
    if (wish.status !== "sent") {
      return false;
    }

    // Creator cannot accept their own wish
    if (wish.creatorId === viewerContext.userId) {
      return false;
    }

    return true;
  }

  /**
   * Can viewer fulfill this wish?
   */
  static canFulfillWish(wish: Wish, viewerContext: ViewerContext): boolean {
    // Only the wished (recipient) can fulfill
    // This would need recipient context to determine if they are the "wished"
    // For now, we'll just check if they're not the creator
    if (wish.creatorId === viewerContext.userId) {
      return false;
    }

    // Can fulfill accepted or confirmed wishes
    return wish.status === "accepted" || wish.status === "confirmed";
  }
}
