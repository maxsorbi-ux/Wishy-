/**
 * NotificationsScreen - Phase 4 Refactored Version
 *
 * Displays and manages notifications:
 * - useRepositories() for loading notifications + pending requests
 * - useConnectionUseCases() for accepting/declining contact requests
 * - useEventListeners() for real-time notification updates
 * - Local state for UI concerns only
 */

import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Modal, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as PushNotifications from "expo-notifications";

// Phase 4: Use new hooks instead of stores
import {
  useConnectionUseCases,
  useRepositories,
  useEventListeners,
} from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { useToastStore } from "../state/toastStore";
import { cn } from "../utils/cn";
import { Notification, ContactRequest } from "../types/wishy";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const currentUser = useUserStore((s) => s.currentUser);
  const allUsers = useUserStore((s) => s.allUsers);
  const fetchAllUsers = useUserStore((s) => s.fetchAllUsers);
  const showToast = useToastStore((s) => s.showToast);

  // Phase 4: Use hooks
  const useCases = useConnectionUseCases()();
  const repos = useRepositories()();

  // Data state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // UI state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);

  const userId = currentUser?.id || "";
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load notifications and pending requests
  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [notifs, requests] = await Promise.all([
        repos.notificationRepository.findByUserId(userId),
        repos.connectionRepository.findPendingRequestsForUser(userId),
      ]);
      setNotifications(notifs);
      setPendingRequests(requests);
      // Update badge count
      const unread = notifs.filter((n: any) => !n.read).length;
      await PushNotifications.setBadgeCountAsync(unread);
    } catch (error) {
      console.error("[NotificationsScreen] Error loading notifications:", error);
      showToast("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, repos.notificationRepository, repos.connectionRepository, showToast]);

  // Load on mount
  useEffect(() => {
    loadNotifications();
    fetchAllUsers();
  }, [userId, loadNotifications, fetchAllUsers]);

  // Subscribe to notification events
  useEventListeners({
    "notification.created": () => {
      console.log("[NotificationsScreen] New notification event");
      loadNotifications();
    },
    "notification.read": () => {
      console.log("[NotificationsScreen] Notification read event");
      loadNotifications();
    },
    "connection.requested": () => {
      console.log("[NotificationsScreen] New connection request");
      loadNotifications();
    },
  });

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadNotifications(), fetchAllUsers()]);
      showToast("✓ Refreshed", "success");
    } catch (error) {
      showToast("Error refreshing", "error");
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications, fetchAllUsers, showToast]);

  // Mark single notification as read
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await useCases.markNotificationAsRead.execute({
          notificationId,
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [useCases.markNotificationAsRead]
  );

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await useCases.markAllNotificationsAsRead.execute({
        userId,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast("✓ Marked all as read", "success");
    } catch (error) {
      showToast("Error marking notifications as read", "error");
    }
  }, [userId, useCases.markAllNotificationsAsRead, showToast]);

  // Accept contact request
  const handleAcceptRequest = useCallback(
    async (connectionType: "friend" | "relationship" = "friend") => {
      if (!selectedRequest || !currentUser) return;

      try {
        setActionLoading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await useCases.acceptConnectionRequest.execute({
          requestId: selectedRequest.id,
          connectionType,
        });
        setShowTypeModal(false);
        setSelectedRequest(null);
        showToast("Connection accepted!", "success");
        loadNotifications();
      } catch (error) {
        showToast(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      } finally {
        setActionLoading(false);
      }
    },
    [selectedRequest, currentUser, useCases.acceptConnectionRequest, showToast, loadNotifications]
  );

  // Decline contact request
  const handleDeclineRequest = useCallback(
    async (requestId: string) => {
      try {
        setActionLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await useCases.declineConnectionRequest.execute({
          requestId,
        });
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        showToast("Request declined", "info");
      } catch (error) {
        showToast("Error declining request", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [useCases.declineConnectionRequest, showToast]
  );

  // Loading state
  if (loading && !notifications.length) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-4 pb-4 bg-white border-b border-gray-200"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">
            Notifications
            {unreadCount > 0 && (
              <View className="inline-flex bg-red-500 rounded-full px-2 py-1 ml-2">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </Text>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllAsRead} className="p-2">
              <Text className="text-blue-600 font-semibold text-sm">Mark All Read</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        {/* Pending Connection Requests */}
        {pendingRequests.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View>
              <Text className="text-gray-900 font-bold text-lg mb-3">
                Connection Requests
              </Text>
              {pendingRequests.map((request) => {
                const requester = allUsers.find(
                  (u) =>
                    u.id ===
                    (request.senderId === userId
                      ? request.receiverId
                      : request.senderId)
                );
                return requester ? (
                  <View
                    key={request.id}
                    className="bg-white rounded-lg p-4 border border-blue-200 mb-3"
                  >
                    <View className="flex-row items-center mb-3">
                      <Image
                        source={{
                          uri:
                            requester.profilePhoto ||
                            "https://via.placeholder.com/48",
                        }}
                        className="w-12 h-12 rounded-full bg-gray-200"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="font-semibold text-gray-900">
                          {requester.name}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          Wants to connect with you
                        </Text>
                      </View>
                    </View>

                    {request.senderId !== userId && (
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => handleDeclineRequest(request.id)}
                          disabled={actionLoading}
                          className="flex-1 bg-gray-200 rounded-lg py-2 items-center"
                        >
                          <Text className="text-gray-900 font-semibold">Decline</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setSelectedRequest(request);
                            setShowTypeModal(true);
                          }}
                          disabled={actionLoading}
                          className="flex-1 bg-blue-500 rounded-lg py-2 items-center"
                        >
                          <Text className="text-white font-semibold">Accept</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : null;
              })}
            </View>
          </Animated.View>
        )}

        {/* Notifications List */}
        {notifications.length === 0 && pendingRequests.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            className="py-12 items-center"
          >
            <Ionicons name="mail-outline" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-lg font-semibold">
              All caught up
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              You have no new notifications
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            {notifications.length > 0 && (
              <View>
                <Text className="text-gray-900 font-bold text-lg mb-3">
                  Recent Activity
                </Text>
                {notifications.map((notif) => {
                  const actor = allUsers.find((u) => u.id === notif.relatedId);
                  return (
                    <Pressable
                      key={notif.id}
                      onPress={() => handleMarkAsRead(notif.id)}
                      className={cn(
                        "rounded-lg p-4 mb-3 border flex-row items-start",
                        notif.read
                          ? "bg-gray-50 border-gray-200"
                          : "bg-blue-50 border-blue-200"
                      )}
                    >
                      {actor && (
                        <Image
                          source={{
                            uri:
                              actor.profilePhoto ||
                              "https://via.placeholder.com/40",
                          }}
                          className="w-10 h-10 rounded-full bg-gray-200"
                        />
                      )}
                      <View className="flex-1 ml-3">
                        <Text className="text-gray-900 font-semibold text-sm">
                          {actor?.name || "Unknown User"}
                        </Text>
                        <Text className="text-gray-600 text-sm mt-1">
                          {notif.message}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-2">
                          {formatTime(new Date(notif.createdAt).toISOString())}
                        </Text>
                      </View>
                      {!notif.read && (
                        <View className="w-3 h-3 bg-blue-500 rounded-full mt-1" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Connection Type Modal */}
      <Modal visible={showTypeModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <Animated.View
            entering={FadeIn.duration(300)}
            className="bg-white rounded-lg p-6 w-full max-w-sm"
          >
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Choose Connection Type
            </Text>
            <Text className="text-gray-600 text-sm mb-6">
              How do you want to connect with{" "}
              {selectedRequest &&
                allUsers.find((u) => u.id === selectedRequest.senderId)?.name}
              ?
            </Text>

            <View className="gap-3 mb-4">
              <Pressable
                onPress={() => handleAcceptRequest("friend")}
                disabled={actionLoading}
                className="bg-blue-100 rounded-lg p-4"
              >
                <Text className="text-blue-900 font-semibold">Friend</Text>
                <Text className="text-blue-700 text-xs mt-1">
                  Connect as friends to share wishes
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleAcceptRequest("relationship")}
                disabled={actionLoading}
                className="bg-pink-100 rounded-lg p-4"
              >
                <Text className="text-pink-900 font-semibold">Relationship</Text>
                <Text className="text-pink-700 text-xs mt-1">
                  Connect as partners for couple mode
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                setShowTypeModal(false);
                setSelectedRequest(null);
              }}
              disabled={actionLoading}
              className="bg-gray-200 rounded-lg py-3"
            >
              <Text className="text-gray-900 font-semibold text-center">
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// Helper function to format time
function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

