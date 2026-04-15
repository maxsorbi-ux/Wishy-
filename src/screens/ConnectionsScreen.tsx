/**
 * ConnectionsScreen - Phase 4 Refactored Version
 *
 * Manages user connections with refined architecture:
 * - useConnectionUseCases() for sending connection requests
 * - useRepositories() for fetching connections and pending requests
 * - useEventListeners() for real-time updates
 * - Local state for UI concerns only
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

// Phase 4: Use new hooks instead of stores
import {
  useConnectionUseCases,
  useRepositories,
  useEventListeners,
} from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { useToastStore } from "../state/toastStore";

// Types & utilities
import { User } from "../types/wishy";
import { Connection, ConnectionType } from "../domain/connections/Connection";
import { ConnectionRequest } from "../domain/connections/ConnectionRequest";
import { cn } from "../utils/cn";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * ConnectionsScreen - Phase 4 Refactored Version
 *
 * Manages user connections with refined architecture:
 * - useConnectionUseCases() for sending connection requests
 * - useRepositories() for fetching connections and pending requests
 * - useEventListeners() for real-time updates
 * - Local state for UI concerns only
 */

export default function ConnectionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const currentUser = useUserStore((s) => s.currentUser);
  const allUsers = useUserStore((s) => s.allUsers);
  const fetchAllUsers = useUserStore((s) => s.fetchAllUsers);
  const showToast = useToastStore((s) => s.showToast);

  // Phase 4: Use hooks
  const useCases = useConnectionUseCases()();
  const repos = useRepositories()();

  // Data state
  const [acceptedConnections, setAcceptedConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"connections" | "pending" | "discover">(
    "connections"
  );
  const [selectedUserForRequest, setSelectedUserForRequest] = useState<User | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const userId = currentUser?.id || "";

  // Load connections from repository
  const loadConnections = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [connections, requests] = await Promise.all([
        repos.connectionRepository.findByUserId(userId),
        repos.connectionRepository.findPendingRequestsForUser(userId),
      ]);
      setAcceptedConnections(connections);
      setPendingRequests(requests);
    } catch (error) {
      console.error("[ConnectionsScreen] Error loading connections:", error);
      showToast("Failed to load connections", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, repos.connectionRepository, showToast]);

  // Load on mount
  useEffect(() => {
    loadConnections();
    fetchAllUsers();
  }, [userId, loadConnections, fetchAllUsers]);

  // Subscribe to connection events
  useEventListeners({
    "connection.requested": (event) => {
      console.log("[ConnectionsScreen] Connection requested event");
      loadConnections();
      showToast("Connection request sent!", "success");
    },
    "connection.accepted": (event) => {
      console.log("[ConnectionsScreen] Connection accepted event");
      loadConnections();
      showToast("✓ Connection accepted!", "success");
    },
    "connection.declined": (event) => {
      console.log("[ConnectionsScreen] Connection declined event");
      loadConnections();
    },
  });

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadConnections(), fetchAllUsers()]);
      showToast("✓ Refreshed", "success");
    } catch (error) {
      showToast("Error refreshing", "error");
    } finally {
      setRefreshing(false);
    }
  }, [loadConnections, fetchAllUsers, showToast]);

  // Send connection request
  const handleSendRequest = useCallback(
    async (targetUserId: string) => {
      if (!currentUser) return;

      try {
        setIsLoadingAction(true);
        await useCases.sendConnectionRequest.execute({
          senderId: currentUser.id,
          receiverId: targetUserId,
        });
        setShowConfirmModal(false);
        setSelectedUserForRequest(null);
      } catch (error) {
        console.error("[ConnectionsScreen] Error sending request:", error);
        showToast(`Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      } finally {
        setIsLoadingAction(false);
      }
    },
    [currentUser, useCases.sendConnectionRequest, showToast]
  );

  // Accept pending request
  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      try {
        setIsLoadingAction(true);
        await useCases.acceptConnectionRequest.execute({
          requestId: requestId,
          connectionType: "friend" as ConnectionType,
        });
        showToast("Connection accepted!", "success");
      } catch (error) {
        showToast("Error accepting request", "error");
      } finally {
        setIsLoadingAction(false);
      }
    },
    [currentUser, useCases.acceptConnectionRequest, showToast]
  );

  // Decline pending request
  const handleDeclineRequest = useCallback(
    async (requestId: string) => {
      try {
        setIsLoadingAction(true);
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        showToast("Request declined", "info");
      } catch (error) {
        showToast("Error declining request", "error");
      } finally {
        setIsLoadingAction(false);
      }
    },
    [showToast]
  );

  const handleQRCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("QRCode");
  };

  const handleToggleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery("");
    }
  };

  const handleNavigateToConnection = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("UserProfile", { userId });
  };

  // Filter users for discovery
  const searchResults =
    searchQuery.trim().length > 0
      ? allUsers.filter((user) => {
          if (user.id === currentUser?.id) return false;
          if (acceptedConnections.some((c) => c.user1Id === user.id || c.user2Id === user.id)) return false;
          if (pendingRequests.some((r) => r.senderId === user.id || r.receiverId === user.id))
            return false;

          const query = searchQuery.toLowerCase();
          return (
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
          );
        })
      : [];

  // Loading state
  if (loading && !acceptedConnections.length) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900">Connections</Text>
          <Pressable onPress={handleQRCode} className="p-2">
            <Ionicons name="qr-code" size={24} color="#3B82F6" />
          </Pressable>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <Animated.View entering={FadeIn}>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
              <Ionicons name="search" size={18} color="#6B7280" />
              <TextInput
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-2 text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close" size={18} color="#6B7280" />
                </Pressable>
              )}
            </View>
          </Animated.View>
        )}

        {/* Search Toggle */}
        <Pressable
          onPress={handleToggleSearch}
          className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2"
        >
          <Ionicons name={showSearch ? "chevron-up" : "search"} size={18} color="#6B7280" />
          <Text className="flex-1 ml-2 text-gray-700">
            {showSearch ? "Hide search" : "Find connections"}
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="bg-white border-b border-gray-200 flex-row">
        <Pressable
          onPress={() => setSelectedTab("connections")}
          className={cn(
            "flex-1 py-3 border-b-2",
            selectedTab === "connections"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white"
          )}
        >
          <Text
            className={cn(
              "text-center font-semibold",
              selectedTab === "connections" ? "text-blue-600" : "text-gray-600"
            )}
          >
            Connections ({acceptedConnections.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedTab("pending")}
          className={cn(
            "flex-1 py-3 border-b-2",
            selectedTab === "pending"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white"
          )}
        >
          <Text
            className={cn(
              "text-center font-semibold",
              selectedTab === "pending" ? "text-blue-600" : "text-gray-600"
            )}
          >
            Pending ({pendingRequests.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedTab("discover")}
          className={cn(
            "flex-1 py-3 border-b-2",
            selectedTab === "discover"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white"
          )}
        >
          <Text
            className={cn(
              "text-center font-semibold",
              selectedTab === "discover" ? "text-blue-600" : "text-gray-600"
            )}
          >
            Discover
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        className="flex-1"
      >
        {selectedTab === "connections" && (
          <View className="p-4 gap-3">
            {acceptedConnections.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">No connections yet</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Use the search above to find and connect with users
                </Text>
              </View>
            ) : (
              acceptedConnections.map((connection) => {
                const otherUser = allUsers.find((u) => u.id === (connection.user1Id === userId ? connection.user2Id : connection.user1Id));
                return otherUser ? (
                  <Pressable
                    key={connection.id}
                    onPress={() => handleNavigateToConnection(otherUser.id)}
                    className="bg-white rounded-lg p-4 flex-row items-center border border-gray-200"
                  >
                    <Image
                      source={{
                        uri:
                          otherUser.profilePhoto || "https://via.placeholder.com/48",
                      }}
                      className="w-12 h-12 rounded-full bg-gray-200"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="font-semibold text-gray-900">{otherUser.name}</Text>
                      <Text className="text-sm text-gray-500">
                        {connection.type === "friend"
                          ? "Friend"
                          : "Relationship"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                  </Pressable>
                ) : null;
              })
            )}
          </View>
        )}

        {selectedTab === "pending" && (
          <View className="p-4 gap-3">
            {pendingRequests.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="mail-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">No pending requests</Text>
              </View>
            ) : (
              pendingRequests.map((request) => {
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
                    className="bg-white rounded-lg p-4 border border-blue-200"
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
                        <Text className="text-xs text-gray-500">
                          {request.senderId === userId
                            ? "You sent a request"
                            : "Wants to connect"}
                        </Text>
                      </View>
                    </View>

                    {request.senderId !== userId && (
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => handleAcceptRequest(request.id)}
                          disabled={isLoadingAction}
                          className="flex-1 bg-blue-500 rounded-lg py-2 items-center"
                        >
                          <Text className="text-white font-semibold">
                            {isLoadingAction ? "..." : "Accept"}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeclineRequest(request.id)}
                          disabled={isLoadingAction}
                          className="flex-1 bg-gray-200 rounded-lg py-2 items-center"
                        >
                          <Text className="text-gray-900 font-semibold">Decline</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : null;
              })
            )}
          </View>
        )}

        {selectedTab === "discover" && (
          <View className="p-4 gap-3">
            {!showSearch ? (
              <View className="py-8 items-center">
                <Ionicons name="search" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">Search for users to discover</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Find people by name or email
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="person-remove-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">No users found</Text>
              </View>
            ) : (
              searchResults.map((user) => (
                <Pressable
                  key={user.id}
                  className="bg-white rounded-lg p-4 flex-row items-center border border-gray-200"
                >
                  <Image
                    source={{
                      uri: user.profilePhoto || "https://via.placeholder.com/48",
                    }}
                    className="w-12 h-12 rounded-full bg-gray-200"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-gray-900">{user.name}</Text>
                    <Text className="text-sm text-gray-500">{user.email}</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setSelectedUserForRequest(user);
                      setShowConfirmModal(true);
                    }}
                    disabled={isLoadingAction}
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-semibold text-sm">
                      {isLoadingAction ? "..." : "Connect"}
                    </Text>
                  </Pressable>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Confirm Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-lg p-6 gap-4 w-full max-w-sm">
            <Text className="text-lg font-bold text-gray-900">
              Connect with {selectedUserForRequest?.name}?
            </Text>
            <Text className="text-gray-600">
              Send a connection request to {selectedUserForRequest?.email}
            </Text>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setShowConfirmModal(false);
                  setSelectedUserForRequest(null);
                }}
                disabled={isLoadingAction}
                className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-900 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  selectedUserForRequest && handleSendRequest(selectedUserForRequest.id)
                }
                disabled={isLoadingAction}
                className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold">
                  {isLoadingAction ? "Sending..." : "Send Request"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
