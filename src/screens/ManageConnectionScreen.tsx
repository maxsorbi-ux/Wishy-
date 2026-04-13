import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";

// Phase 4: Use new hooks instead of stores
import {
  useConnectionUseCases,
  useRepositories,
  useEventListeners,
} from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { useToastStore } from "../state/toastStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = RouteProp<RootStackParamList, "ManageConnection">;

/**
 * ManageConnectionScreen - Phase 4 Refactored Version
 *
 * Manages a single connection:
 * - Load connection details from repository
 * - Use cases for upgrading/downgrading connection type
 * - Use cases for removing/blocking user
 * - Event listeners for real-time updates
 */
export default function ManageConnectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();

  const currentUser = useUserStore((s) => s.currentUser);
  const allUsers = useUserStore((s) => s.allUsers);
  const showToast = useToastStore((s) => s.showToast);

  // Phase 4: Use hooks
  const useCases = useConnectionUseCases()();
  const repos = useRepositories()();

  const { userId } = route.params;
  const otherUser = allUsers.find((u) => u.id === userId);

  // State
  const [connection, setConnection] = useState(null as any);
  const [pendingUpgradeRequest, setPendingUpgradeRequest] = useState(null as any);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load connection details
  const loadConnection = useCallback(async () => {
    if (!currentUser || !userId) return;
    try {
      setLoading(true);
      const [conn, upgrade] = await Promise.all([
        repos.connectionRepository.findBetweenUsers(currentUser.id, userId),
        repos.connectionRepository.findPendingUpgradeRequest(currentUser.id, userId),
      ]);
      setConnection(conn);
      setPendingUpgradeRequest(upgrade);
    } catch (error) {
      console.error("[ManageConnectionScreen] Error loading connection:", error);
      showToast("Failed to load connection", "error");
    } finally {
      setLoading(false);
    }
  }, [currentUser, userId, repos.connectionRepository, showToast]);

  // Load on mount
  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  // Subscribe to connection events
  useEventListeners({
    "connection.updated": () => loadConnection(),
    "connection.upgrade-requested": () => loadConnection(),
    "connection.upgrade-accepted": () => {
      loadConnection();
      showToast("✓ Relationship status updated!", "success");
    },
  });

  // Handle upgrade to relationship
  const handleUpgradeToRelationship = useCallback(async () => {
    if (!currentUser || !connection) return;

    try {
      setActionLoading(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await useCases.upgradeConnectionToRelationship.execute({
        connectionId: connection.id,
        initiatorId: currentUser.id,
        targetUserId: otherUser?.id!,
      });
      setShowUpgradeModal(false);
      showToast("Relationship request sent!");
    } catch (error) {
      showToast(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      setActionLoading(false);
    }
  }, [currentUser, connection, otherUser, useCases.upgradeConnectionToRelationship, showToast]);

  // Handle downgrade to friend
  const handleDowngradeToFriend = useCallback(async () => {
    if (!connection) return;

    try {
      setActionLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await useCases.downgradeConnectionToFriend.execute({
        connectionId: connection.id,
      });
      showToast("Connection changed to Friend");
    } catch (error) {
      showToast("Error downgrading connection", "error");
    } finally {
      setActionLoading(false);
    }
  }, [connection, useCases.downgradeConnectionToFriend, showToast]);

  // Handle accept upgrade request
  const handleAcceptUpgradeRequest = useCallback(async () => {
    if (!pendingUpgradeRequest || !currentUser) return;

    try {
      setActionLoading(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await useCases.acceptUpgradeRequest.execute({
        upgradeRequestId: pendingUpgradeRequest.id,
        acceptedBy: currentUser.id,
      });
      showToast("Relationship request accepted!", "success");
    } catch (error) {
      showToast("Error accepting request", "error");
    } finally {
      setActionLoading(false);
    }
  }, [pendingUpgradeRequest, currentUser, useCases.acceptUpgradeRequest, showToast]);

  // Handle reject upgrade request
  const handleRejectUpgradeRequest = useCallback(async () => {
    if (!pendingUpgradeRequest) return;

    try {
      setActionLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await useCases.rejectUpgradeRequest.execute({
        upgradeRequestId: pendingUpgradeRequest.id,
      });
      showToast("Relationship request declined", "info");
      setPendingUpgradeRequest(null);
    } catch (error) {
      showToast("Error rejecting request", "error");
    } finally {
      setActionLoading(false);
    }
  }, [pendingUpgradeRequest, useCases.rejectUpgradeRequest, showToast]);

  // Handle remove connection
  const handleRemoveConnection = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Remove Connection",
      `Are you sure you want to remove ${otherUser?.name} from your connections?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              if (connection) {
                await useCases.removeConnection.execute({
                  connectionId: connection.id,
                });
              }
              navigation.goBack();
            } catch (error) {
              showToast("Error removing connection", "error");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }, [connection, otherUser, useCases.removeConnection, showToast, navigation]);

  // Handle block user
  const handleBlockUser = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${otherUser?.name}? This will remove the connection and prevent them from contacting you.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              if (currentUser && otherUser) {
                await useCases.blockUser.execute({
                  blockerId: currentUser.id,
                  blockedUserId: otherUser.id,
                });
              }
              navigation.goBack();
            } catch (error) {
              showToast("Error blocking user", "error");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }, [currentUser, otherUser, useCases.blockUser, showToast, navigation]);

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!currentUser || !otherUser || !connection) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Connection not found</Text>
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
        <View className="flex-row items-center">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={28} color="#3B82F6" />
          </Pressable>
          <Text className="flex-1 text-center text-gray-900 font-bold text-xl mr-10">
            Manage Connection
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* User Info Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View className="bg-white rounded-lg p-6 items-center mb-6 border border-gray-200">
            <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden border-4 border-blue-500 mb-4">
              {otherUser.profileImageUrl ? (
                <Image
                  source={{ uri: otherUser.profileImageUrl }}
                  style={{ width: 96, height: 96 }}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={48} color="#9CA3AF" />
              )}
            </View>
            <Text className="text-gray-900 font-bold text-2xl mb-1">
              {otherUser.name}
            </Text>
            <View className="bg-gray-100 px-4 py-2 rounded-full mt-3">
              <Text className="text-gray-700 font-semibold capitalize">
                {connection.connectionType === "relationship"
                  ? "In a Relationship"
                  : "Social Connection"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Connection Type Management */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text className="text-gray-900 font-bold text-lg mb-3">
            Connection Type
          </Text>

          {connection.connectionType === "friend" ? (
            <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="people" size={24} color="#3B82F6" />
                <Text className="text-gray-900 font-semibold text-base ml-3 flex-1">
                  Friend
                </Text>
              </View>
              {pendingUpgradeRequest ? (
                <>
                  <Text className="text-gray-600 text-sm mb-4">
                    {pendingUpgradeRequest.initiatorId === currentUser.id
                      ? `You sent a relationship request to ${otherUser.name}. Waiting for approval.`
                      : `${otherUser.name} wants to upgrade your connection to a relationship.`}
                  </Text>
                  {pendingUpgradeRequest.initiatorId === currentUser.id ? (
                    <View className="bg-amber-100 px-4 py-2 rounded-lg">
                      <Text className="text-amber-700 font-semibold text-center">
                        Request Pending
                      </Text>
                    </View>
                  ) : (
                    <View className="gap-3">
                      <Pressable
                        onPress={handleAcceptUpgradeRequest}
                        disabled={actionLoading}
                        className="bg-blue-500 rounded-lg py-3 items-center"
                      >
                        <Text className="text-white font-bold">
                          {actionLoading ? "..." : "Accept Relationship"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleRejectUpgradeRequest}
                        disabled={actionLoading}
                        className="bg-gray-200 rounded-lg py-3 items-center"
                      >
                        <Text className="text-gray-900 font-semibold">
                          Decline
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text className="text-gray-600 text-sm mb-4">
                    You and {otherUser.name} are connected as friends. Upgrade to &quot;In a
                    Relationship&quot; to share a special bond.
                  </Text>
                  <Pressable
                    onPress={() => setShowUpgradeModal(true)}
                    disabled={actionLoading}
                    className="bg-blue-500 rounded-lg py-3 items-center"
                  >
                    <Text className="text-white font-bold">
                      Propose Relationship Status
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            <View className="bg-white rounded-lg p-4 mb-4 border border-pink-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="heart" size={24} color="#EC4899" />
                <Text className="text-gray-900 font-semibold text-base ml-3 flex-1">
                  In a Relationship
                </Text>
              </View>
              <Text className="text-gray-600 text-sm mb-4">
                You and {otherUser.name} are in a relationship. This status is visible on both
                profiles.
              </Text>
              <Pressable
                onPress={handleDowngradeToFriend}
                disabled={actionLoading}
                className="bg-gray-200 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-900 font-semibold">Change to Friend</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text className="text-gray-900 font-bold text-lg mb-3">
            Manage Connection
          </Text>

          <View className="bg-white rounded-lg p-4 border border-red-200">
            <Pressable
              onPress={handleRemoveConnection}
              disabled={actionLoading}
              className="py-3 border-b border-gray-200"
            >
              <View className="flex-row items-center">
                <Ionicons name="remove-circle-outline" size={24} color="#DC2626" />
                <Text className="text-red-600 font-semibold ml-3">
                  Remove Connection
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleBlockUser}
              disabled={actionLoading}
              className="py-3"
            >
              <View className="flex-row items-center">
                <Ionicons name="ban-outline" size={24} color="#DC2626" />
                <Text className="text-red-600 font-semibold ml-3">
                  Block User
                </Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Upgrade Modal */}
      {showUpgradeModal && !actionLoading && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="bg-white rounded-lg p-6 mx-8 max-w-sm"
          >
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-pink-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="heart" size={32} color="#EC4899" />
              </View>
              <Text className="text-gray-900 font-bold text-xl mb-2">
                Propose Relationship?
              </Text>
              <Text className="text-gray-600 text-center text-sm">
                This will change your connection with {otherUser.name} to &quot;In a Relationship&quot; and
                will be visible on both profiles.
              </Text>
            </View>

            <View className="gap-3">
              <Pressable
                onPress={handleUpgradeToRelationship}
                disabled={actionLoading}
                className="bg-blue-500 rounded-lg py-4 items-center"
              >
                <Text className="text-white font-bold text-base">
                  {actionLoading ? "Sending..." : "Yes, Propose Relationship"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowUpgradeModal(false)}
                disabled={actionLoading}
                className="bg-gray-200 rounded-lg py-4 items-center"
              >
                <Text className="text-gray-900 font-semibold text-base">Cancel</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
