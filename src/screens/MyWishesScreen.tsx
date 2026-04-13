/**
 * MyWishesScreen - Phase 4 Refactored Version
 *
 * This screen demonstrates:
 * - Using repositories to fetch wishes (instead of stores)
 * - Subscribing to domain events for real-time updates
 * - Local filtering and tab management
 * - No Zustand store subscriptions for this data
 *
 * The architecture:
 * - Repository fetches wishes from Supabase
 * - Events notify when wishes change (sent, accepted, etc.)
 * - Local state manages tabs and UI
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl, FlatList, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

// Phase 4: Use new hooks and repositories
import { useRepositories, useEventListeners } from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { Wish } from "../domain";
import { cn } from "../utils/cn";
import { useToastStore } from "../state/toastStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TabType = "for-me" | "for-others" | "received";

interface WishUIProps {
  wish: Wish;
  onPress: () => void;
}

/**
 * Single wish card component
 */
function WishCard({ wish, onPress }: WishUIProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden active:opacity-70 mb-3"
    >
      <View className="flex-row h-24">
        {wish.imageUrl && (
          <Image
            source={{ uri: wish.imageUrl }}
            className="w-24 h-24 bg-gray-100"
          />
        )}
        <View className="flex-1 p-3 justify-between">
          <View className="gap-1">
            <Text className="font-semibold text-gray-900 text-sm line-clamp-2">
              {wish.title}
            </Text>
            <Text className="text-xs text-gray-500">
              {wish.status}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <View className="bg-blue-50 rounded px-2 py-1">
              <Text className="text-xs text-blue-700 font-medium">
                {wish.category}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function MyWishesScreenV2() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const currentUser = useUserStore((s) => s.currentUser);
  const showToast = useToastStore((s) => s.showToast);

  // Phase 4: Use repositories instead of stores
  const repos = useRepositories()();

  // State management
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("for-me");

  const userId = currentUser?.id || "";

  // Subscribe to wish events for real-time updates
  useEventListeners({
    "wish.sent": (event) => {
      console.log("[MyWishesScreen] Wish sent event - reloading wishes");
      // In a real app, you might append instead of reload
      loadWishes();
      showToast("New wish sent!", "success");
    },
    "wish.accepted": (event) => {
      console.log("[MyWishesScreen] Wish accepted event - updating wishes");
      loadWishes();
      showToast("Wish accepted!", "success");
    },
    "wish.rejected": (event) => {
      console.log("[MyWishesScreen] Wish rejected event");
      loadWishes();
    },
  });

  // Load wishes from repository
  const loadWishes = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      // Phase 4: Fetch from repository instead of store
      const creatorWishes = await repos.wishes.findByCreatorId(userId);
      const recipientWishes = await repos.wishes.findRecipientWishes(userId);

      // Merge and sort by date
      const allWishes = [...creatorWishes, ...recipientWishes];
      allWishes.sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate;
      });

      setWishes(allWishes);
    } catch (error) {
      console.error("[MyWishesScreen] Error loading wishes:", error);
      showToast("Failed to load wishes", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, repos.wishes, showToast]);

  // Load wishes on mount and when user changes
  useEffect(() => {
    loadWishes();
  }, [loadWishes]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWishes();
    }, [loadWishes])
  );

  // Filter wishes by tab
  const filteredWishes = useMemo(() => {
    switch (activeTab) {
      case "for-me":
        return wishes.filter((wish) => wish.creatorId === userId);
      case "for-others":
        return wishes.filter((wish) => wish.creatorId === userId);
      case "received":
        return wishes.filter((wish) => wish.creatorId !== userId);
      default:
        return [];
    }
  }, [wishes, activeTab, userId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWishes();
    setRefreshing(false);
  }, [loadWishes]);

  const handleWishPress = useCallback(
    (wishId: string) => {
      Haptics.selectionAsync();
      navigation.navigate("WishDetail" as any, { wishId });
    },
    [navigation]
  );

  const handleCreateWish = useCallback(() => {
    Haptics.selectionAsync();
    navigation.navigate("CreateWish" as any, { mode: "wishlist" });
  }, [navigation]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-4 pb-3 px-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">My Wishes</Text>
          <Pressable
            onPress={handleCreateWish}
            className="bg-blue-500 rounded-full p-3 active:bg-blue-600"
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
          {(["for-me", "for-others", "received"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                Haptics.selectionAsync();
              }}
              className={cn(
                "px-4 py-2 rounded-full border-2 min-w-fit",
                activeTab === tab
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              )}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  activeTab === tab ? "text-blue-600" : "text-gray-700"
                )}
              >
                {tab === "for-me" ? "My List" : tab === "for-others" ? "Portfolio" : "Received"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredWishes.length === 0 ? (
        <Animated.View
          entering={FadeInDown}
          className="flex-1 items-center justify-center gap-4 px-4"
        >
          <Ionicons name="heart-outline" size={48} color="#d1d5db" />
          <Text className="text-lg font-semibold text-gray-600">No wishes yet</Text>
          <Text className="text-sm text-gray-500 text-center">
            {activeTab === "received"
              ? "Check back when friends share wishes with you"
              : "Create your first wish to get started"}
          </Text>
          {activeTab !== "received" && (
            <Pressable
              onPress={handleCreateWish}
              className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Create Wish</Text>
            </Pressable>
          )}
        </Animated.View>
      ) : (
        <FlatList
          data={filteredWishes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WishCard
              wish={item}
              onPress={() => handleWishPress(item.id)}
            />
          )}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          scrollIndicatorInsets={{ bottom: insets.bottom }}
        />
      )}
    </View>
  );
}
