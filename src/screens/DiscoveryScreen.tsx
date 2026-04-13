import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

// Phase 4: Use new hooks instead of stores
import { useRepositories, useEventListeners } from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { batchEnrichWishes } from "../utils/enrichWishWithRecipients";
import { Wish, WishCategory, CATEGORY_LABELS, User } from "../types/wishy";
import { cn } from "../utils/cn";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: (WishCategory | "all")[] = [
  "all", "dining", "travel", "experience", "gift", "entertainment", "wellness", "adventure", "romantic"
];

/**
 * DiscoveryScreen - Phase 4 Refactored Version
 *
 * Displays wishes received by current user:
 * - useRepositories() for loading wishes
 * - useEventListeners() for real-time updates
 * - Local state for filters and UI
 */
export default function DiscoveryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const currentUser = useUserStore((s) => s.currentUser);
  const allUsers = useUserStore((s) => s.allUsers);

  // Phase 4: Use hooks
  const repos = useRepositories()();

  // Data state
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<WishCategory | "all">("all");

  const userId = currentUser?.id || "";

  // Filter received wishes
  const receivedWishes = wishes.filter((wish) => {
    const isTargetedToMe =
      wish.targetUserId === userId ||
      (wish.targetUserIds && wish.targetUserIds.includes(userId));
    return isTargetedToMe && wish.creatorId !== userId;
  });

  const filteredWishes =
    selectedCategory === "all"
      ? receivedWishes
      : receivedWishes.filter((w) => w.category === selectedCategory);

  // Load wishes from repository
  const loadWishes = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // Load wishes received by current user
      const data = await repos.wishRepository.findRecipientWishes(userId);
      
      // Batch enrich wishes with recipient data (single query)
      const enrichedWishes = await batchEnrichWishes(data, repos.wishRecipientRepository);
      
      setWishes(enrichedWishes);
    } catch (error) {
      console.error("[DiscoveryScreen] Error loading wishes:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, repos.wishRepository, repos.wishRecipientRepository]);

  // Load on mount
  useEffect(() => {
    loadWishes();
  }, [userId, loadWishes]);

  // Subscribe to wish events
  useEventListeners({
    "wish.sent": () => {
      console.log("[DiscoveryScreen] New wish sent event");
      loadWishes();
    },
    "wish.received": () => {
      console.log("[DiscoveryScreen] Wish received event");
      loadWishes();
    },
  });

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadWishes();
    } finally {
      setRefreshing(false);
    }
  }, [loadWishes]);

  const handleWishPress = (wishId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("WishDetail", { wishId });
  };

  const handleUserPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("UserProfile", { userId });
  };

  const handleLogoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Landing");
  };

  if (loading && !wishes.length) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-wishy-white">
      {/* Home Icon - Top Left Corner */}
      <Pressable
        onPress={handleLogoPress}
        style={{ position: "absolute", top: insets.top + 8, left: 12, zIndex: 50 }}
        className="w-9 h-9 bg-wishy-white rounded-full items-center justify-center active:opacity-70 shadow-md border border-wishy-paleBlush"
      >
        <Ionicons name="home" size={20} color="#8B2252" />
      </Pressable>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingTop: insets.top }}
        className="max-h-14 border-b border-wishy-paleBlush"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
      >
        {CATEGORIES.map((category) => (
          <Pressable
            key={category}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(category);
            }}
            className={cn(
              "px-4 py-2 rounded-full",
              selectedCategory === category
                ? "bg-wishy-black"
                : "bg-white border border-wishy-paleBlush"
            )}
          >
            <Text
              className={cn(
                "text-sm font-medium",
                selectedCategory === category ? "text-wishy-white" : "text-wishy-black"
              )}
            >
              {category === "all" ? "All" : CATEGORY_LABELS[category]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Wishes Grid */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B2252"
          />
        }
      >
        {filteredWishes.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 bg-wishy-paleBlush rounded-full items-center justify-center mb-4">
              <Ionicons name="gift-outline" size={40} color="#8B2252" />
            </View>
            <Text className="text-wishy-black font-semibold text-lg">No Wishes Received</Text>
            <Text className="text-wishy-gray mt-2 text-center px-8">
              When others send you wishes, they will appear here
            </Text>
          </View>
        ) : (
          filteredWishes.map((wish, index) => {
            const sender = allUsers.find((u) => u.id === wish.creatorId);
            return (
              <Animated.View
                key={wish.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
              >
                <WishCard
                  wish={wish}
                  sender={sender}
                  onPress={() => handleWishPress(wish.id)}
                  onUserPress={() => sender && handleUserPress(sender.id)}
                />
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

  const handleWishPress = (wishId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("WishDetail", { wishId });
  };

  const handleUserPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("UserProfile", { userId });
  };

  const handleLogoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Landing");
  };

  return (
    <View className="flex-1 bg-wishy-white">
      {/* Home Icon - Top Left Corner */}
      <Pressable
        onPress={handleLogoPress}
        style={{ position: "absolute", top: insets.top + 8, left: 12, zIndex: 50 }}
        className="w-9 h-9 bg-wishy-white rounded-full items-center justify-center active:opacity-70 shadow-md border border-wishy-paleBlush"
      >
        <Ionicons name="home" size={20} color="#8B2252" />
      </Pressable>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingTop: insets.top }}
        className="max-h-14 border-b border-wishy-paleBlush"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
      >
        {CATEGORIES.map((category) => (
          <Pressable
            key={category}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(category);
            }}
            className={cn(
              "px-4 py-2 rounded-full",
              selectedCategory === category
                ? "bg-wishy-black"
                : "bg-white border border-wishy-paleBlush"
            )}
          >
            <Text
              className={cn(
                "text-sm font-medium",
                selectedCategory === category ? "text-wishy-white" : "text-wishy-black"
              )}
            >
              {category === "all" ? "All" : CATEGORY_LABELS[category]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Wishes Grid */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B2252"
          />
        }
      >
        {filteredWishes.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 bg-wishy-paleBlush rounded-full items-center justify-center mb-4">
              <Ionicons name="gift-outline" size={40} color="#8B2252" />
            </View>
            <Text className="text-wishy-black font-semibold text-lg">No Wishes Received</Text>
            <Text className="text-wishy-gray mt-2 text-center px-8">
              When others send you wishes, they will appear here
            </Text>
          </View>
        ) : (
          filteredWishes.map((wish, index) => {
            const sender = allUsers.find((u) => u.id === wish.creatorId);
            return (
              <Animated.View
                key={wish.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
              >
                <WishCard
                  wish={wish}
                  sender={sender}
                  onPress={() => handleWishPress(wish.id)}
                  onUserPress={() => sender && handleUserPress(sender.id)}
                />
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function WishCard({
  wish,
  sender,
  onPress,
  onUserPress
}: {
  wish: Wish;
  sender?: User;
  onPress: () => void;
  onUserPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl overflow-hidden shadow-sm active:opacity-95"
    >
      {wish.image && (
        <Image
          source={{ uri: wish.image }}
          style={{ width: "100%", height: 200 }}
          contentFit="cover"
        />
      )}
      <View className="p-4">
        {/* Sender Info */}
        {sender && (
          <Pressable
            onPress={onUserPress}
            className="flex-row items-center mb-3 pb-3 border-b border-wishy-paleBlush"
          >
            {sender.profilePhoto ? (
              <Image
                source={{ uri: sender.profilePhoto }}
                style={{ width: 40, height: 40 }}
                className="rounded-full mr-3"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-wishy-paleBlush items-center justify-center mr-3">
                <Ionicons name="person" size={20} color="#4A1528" />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-wishy-gray text-xs">From</Text>
              <Text className="text-wishy-black font-semibold text-base">{sender.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9A8A8A" />
          </Pressable>
        )}

        <View className="flex-row items-center justify-between">
          <View className="bg-wishy-paleBlush px-3 py-1 rounded-full">
            <Text className="text-wishy-black text-xs font-medium">
              {CATEGORY_LABELS[wish.category]}
            </Text>
          </View>
        </View>
        <Text className="text-wishy-black font-semibold text-lg mt-3">
          {wish.title}
        </Text>
        <Text className="text-wishy-gray text-sm mt-1 leading-5" numberOfLines={2}>
          {wish.description}
        </Text>
        {wish.location && (
          <View className="flex-row items-center mt-3">
            <Ionicons name="location-outline" size={14} color="#9A8A8A" />
            <Text className="text-wishy-gray text-xs ml-1">{wish.location}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
