import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Linking, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

// Phase 4: Use new hooks instead of stores
import { useRepositories, useEventListeners } from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { batchEnrichWishes } from "../utils/enrichWishWithRecipients";
import { Wish, CATEGORY_LABELS, WISH_STATUS_LABELS } from "../types/wishy";
import { useUserProfileComputed } from "./hooks/useUserProfileComputed";
import { cn } from "../utils/cn";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserProfileRouteProp = RouteProp<RootStackParamList, "UserProfile">;

/**
 * UserProfileScreen - Phase 4 Refactored Version
 *
 * Displays other user's profile with wish statistics:
 * - useRepositories() for loading wishes and connections
 * - All useMemos logic remains unchanged (data source only changes)
 * - useEventListeners() for real-time updates
 */
export default function UserProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UserProfileRouteProp>();
  const insets = useSafeAreaInsets();

  const allUsers = useUserStore((s) => s.allUsers);
  const currentUser = useUserStore((s) => s.currentUser);

  // Phase 4: Use hooks
  const repos = useRepositories()();

  // Data state
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedTab, setSelectedTab] = useState<"overview" | "wishlist" | "portfolio">("overview");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "sent" | "accepted_pending" | "fulfilled" | "rejected">("all");
  const [showEnlargedPhoto, setShowEnlargedPhoto] = useState(false);

  const user = allUsers.find((u) => u.id === route.params.userId);

  // Load wishes and connections
  const loadUserData = useCallback(async () => {
    if (!currentUser?.id || !user?.id) return;
    try {
      setLoading(true);
      const [w, c] = await Promise.all([
        repos.wishRepository.findAll(),
        repos.connectionRepository.findByUserId(currentUser.id),
      ]);

      // Batch enrich wishes with recipient data (single query)
      const enrichedWishes = await batchEnrichWishes(w, repos.wishRecipientRepository);

      setWishes(enrichedWishes);
      setConnections(c.filter((conn) => conn.status === "accepted"));
    } catch (error) {
      console.error("[UserProfileScreen] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, user?.id, repos.wishRepository, repos.connectionRepository, repos.wishRecipientRepository]);

  // Load on mount
  useEffect(() => {
    loadUserData();
  }, [currentUser?.id, user?.id, loadUserData]);

  // Subscribe to updates
  useEventListeners({
    "wish.sent": () => loadUserData(),
    "wish.received": () => loadUserData(),
    "connection.accepted": () => loadUserData(),
  });

  // Use extracted computed values hook
  const {
    isConnected,
    wishesBetweenUs,
    wishesSharedWithMe,
    userWishlist,
    userPortfolio,
    userRating,
    userRelationships,
    statistics,
    filteredWishes,
  } = useUserProfileComputed({
    wishes,
    connections,
    allUsers,
    currentUser,
    user,
    selectedFilter,
  });

  const StatCard = ({
    label,
    count,
    icon,
    color,
    onPress,
  }: {
    label: string;
    count: number;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress}
      className={cn(
        "flex-1 bg-white rounded-xl p-4 border-2",
        onPress && "active:opacity-70"
      )}
      style={{ borderColor: color }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Ionicons name={icon as any} size={24} color={color} />
        <Text className="font-bold text-2xl" style={{ color }}>
          {count}
        </Text>
      </View>
      <Text className="text-wishy-gray text-sm">{label}</Text>
    </Pressable>
  );

  const WishCard = ({ wish }: { wish: Wish }) => (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate("WishDetail", { wishId: wish.id });
      }}
      className="bg-white rounded-xl overflow-hidden mb-3 border border-wishy-paleBlush active:opacity-70"
    >
      {wish.image && (
        <Image
          source={{ uri: wish.image }}
          style={{ width: "100%", height: 160 }}
          contentFit="cover"
        />
      )}
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="bg-wishy-paleBlush px-3 py-1 rounded-full">
            <Text className="text-wishy-black text-xs font-medium">
              {wish.customCategory || CATEGORY_LABELS[wish.category]}
            </Text>
          </View>
          <View
            className={cn(
              "px-3 py-1 rounded-full",
              wish.status === "fulfilled" ? "bg-wishy-darkPink" :
              wish.status === "confirmed" ? "bg-wishy-pink" :
              wish.status === "date_set" ? "bg-wishy-pink" :
              wish.status === "accepted" ? "bg-wishy-pink" :
              wish.status === "sent" ? "bg-wishy-paleBlush" :
              wish.status === "rejected" ? "bg-black" : "bg-gray-100"
            )}
          >
            <Text
              className={cn(
                "text-xs font-medium",
                wish.status === "fulfilled" ? "text-white" :
                wish.status === "confirmed" ? "text-white" :
                wish.status === "date_set" ? "text-white" :
                wish.status === "accepted" ? "text-white" :
                wish.status === "sent" ? "text-wishy-darkPink" :
                wish.status === "rejected" ? "text-white" : "text-gray-700"
              )}
            >
              {WISH_STATUS_LABELS[wish.status] || wish.status}
            </Text>
          </View>
        </View>
        <Text className="text-wishy-black font-semibold text-lg">
          {wish.title}
        </Text>
        <Text className="text-wishy-gray text-sm mt-1" numberOfLines={2}>
          {wish.description}
        </Text>
        {wish.location && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="location-outline" size={14} color="#9A8A8A" />
            <Text className="text-wishy-gray text-xs ml-1">{wish.location}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-wishy-white">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-wishy-pink px-6 pb-6"
      >
        <View className="flex-row items-center justify-between mt-4">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#000000" />
          </Pressable>
          <Text className="text-wishy-black font-bold text-xl">Profile</Text>
          <View style={{ width: 28 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="items-center pt-6 pb-6 px-6"
        >
          <Pressable
            onPress={() => {
              if (user.profilePhoto) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEnlargedPhoto(true);
              }
            }}
          >
            <View className="w-28 h-28 rounded-full bg-wishy-paleBlush items-center justify-center overflow-hidden border-4 border-wishy-pink">
              {user.profilePhoto ? (
                <Image
                  source={{ uri: user.profilePhoto }}
                  style={{ width: 112, height: 112 }}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={48} color="#8B2252" />
              )}
            </View>
          </Pressable>
          <Text className="text-wishy-black font-bold text-2xl mt-4">
            {user.name}
          </Text>
          {user.bio && (
            <Text className="text-wishy-gray text-center mt-2 px-4">
              {user.bio}
            </Text>
          )}

          {/* Role Badge */}
          <View className="flex-row mt-4 space-x-2">
            <View className="bg-wishy-black px-4 py-2 rounded-full flex-row items-center">
              <Ionicons name="sparkles" size={16} color="#D4AF37" />
              <Text className="text-wishy-white font-medium ml-2 capitalize">
                {user.role === "both" ? "Wisher & Wished" : user.role}
              </Text>
            </View>
            {user.isElite && (
              <View className="bg-wishy-darkPink px-4 py-2 rounded-full">
                <Text className="text-wishy-black font-medium">Elite</Text>
              </View>
            )}
          </View>

          {/* Rating Display */}
          {userRating.total > 0 && (
            <View className="mt-4 bg-wishy-paleBlush px-6 py-4 rounded-2xl border-2 border-wishy-pink">
              <View className="flex-row items-center justify-center mb-2">
                <Ionicons name="sparkles" size={20} color="#8B2252" />
                <Text className="text-wishy-black font-bold text-lg ml-2">
                  Satisfaction Rating
                </Text>
              </View>
              <View className="flex-row items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((wand) => (
                  <Ionicons
                    key={wand}
                    name="sparkles"
                    size={24}
                    color={userRating.average >= wand ? "#8B2252" : "#E5E7EB"}
                  />
                ))}
              </View>
              <Text className="text-center text-wishy-gray text-base mt-2">
                {userRating.average.toFixed(1)} / 5.0 ({userRating.total} {userRating.total === 1 ? "review" : "reviews"})
              </Text>
              {userRating.praised > 0 && (
                <View className="flex-row items-center justify-center mt-2">
                  <Ionicons name="heart" size={18} color="#D4536B" />
                  <Text className="text-wishy-black font-medium ml-2">
                    {userRating.praised} {userRating.praised === 1 ? "heart" : "hearts"} received
                  </Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Connection Status Warning */}
        {!isConnected && (
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            className="px-6 mb-4"
          >
            <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex-row items-center">
              <Ionicons name="information-circle" size={24} color="#F59E0B" />
              <Text className="text-yellow-800 ml-3 flex-1 text-sm">
                Connect with this user to see their full profile and wishes
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Show detailed info only if connected */}
        {isConnected && (
          <>
            {/* Tab Navigation */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              className="px-6 mb-4"
            >
              <View className="flex-row bg-wishy-paleBlush/30 rounded-xl p-1">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTab("overview");
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-lg",
                    selectedTab === "overview" && "bg-wishy-white"
                  )}
                >
                  <Text
                    className={cn(
                      "text-center font-semibold",
                      selectedTab === "overview"
                        ? "text-wishy-black"
                        : "text-wishy-gray"
                    )}
                  >
                    Overview
                  </Text>
                </Pressable>
                {(user.role === "both" || user.role === "wished") && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedTab("wishlist");
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-lg",
                      selectedTab === "wishlist" && "bg-wishy-white"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-center font-semibold",
                        selectedTab === "wishlist"
                          ? "text-wishy-black"
                          : "text-wishy-gray"
                      )}
                    >
                      Wishlist
                    </Text>
                  </Pressable>
                )}
                {(user.role === "both" || user.role === "wisher") && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedTab("portfolio");
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-lg",
                      selectedTab === "portfolio" && "bg-wishy-white"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-center font-semibold",
                        selectedTab === "portfolio"
                          ? "text-wishy-black"
                          : "text-wishy-gray"
                      )}
                    >
                      Portfolio
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {/* Overview Tab */}
            {selectedTab === "overview" && (
              <>
                {/* Statistics Section */}
                <Animated.View
                  entering={FadeInDown.delay(250).duration(400)}
                  className="px-6 mb-6"
                >
                  <Text className="text-wishy-black font-bold text-lg mb-3">
                    Our Wish Journey
                  </Text>
                  <Text className="text-wishy-gray text-sm mb-4">
                    Tap on a statistic to view related wishes
                  </Text>

                  <View className="flex-row gap-2 mb-3">
                    <StatCard
                      label="Proposed"
                      count={statistics.proposed}
                      icon="mail"
                      color="#FFB6D9"
                      onPress={() => setSelectedFilter("sent")}
                    />
                    <StatCard
                      label="In Progress"
                      count={statistics.acceptedPending}
                      icon="time"
                      color="#8B2252"
                      onPress={() => setSelectedFilter("accepted_pending")}
                    />
                  </View>

                  <View className="flex-row gap-2">
                    <StatCard
                      label="Fulfilled"
                      count={statistics.completed}
                      icon="checkmark-circle"
                      color="#D4536B"
                      onPress={() => setSelectedFilter("fulfilled")}
                    />
                    <StatCard
                      label="Declined"
                      count={statistics.declined}
                      icon="close-circle"
                      color="#4A1528"
                      onPress={() => setSelectedFilter("rejected")}
                    />
                  </View>
                </Animated.View>

                {/* Filtered Wishes List */}
                {selectedFilter !== "all" && (
                  <Animated.View
                    entering={FadeInDown.delay(300).duration(400)}
                    className="px-6 mb-6"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-wishy-black font-bold text-lg">
                        {selectedFilter === "sent" && "Proposed Wishes"}
                        {selectedFilter === "accepted_pending" && "In Progress"}
                        {selectedFilter === "fulfilled" && "Fulfilled Wishes"}
                        {selectedFilter === "rejected" && "Declined Wishes"}
                      </Text>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedFilter("all");
                        }}
                        className="px-3 py-1 bg-wishy-paleBlush rounded-full"
                      >
                        <Text className="text-wishy-black text-sm font-medium">
                          Clear
                        </Text>
                      </Pressable>
                    </View>
                    {filteredWishes.length === 0 ? (
                      <View className="bg-wishy-paleBlush/30 rounded-xl p-6 items-center">
                        <Ionicons name="folder-open-outline" size={48} color="#9A8A8A" />
                        <Text className="text-wishy-gray mt-2 text-center">
                          No wishes in this category
                        </Text>
                      </View>
                    ) : (
                      filteredWishes.map((wish) => (
                        <WishCard key={wish.id} wish={wish} />
                      ))
                    )}
                  </Animated.View>
                )}

                {/* All Wishes Between Us */}
                {selectedFilter === "all" && (
                  <Animated.View
                    entering={FadeInDown.delay(300).duration(400)}
                    className="px-6 mb-6"
                  >
                    <Text className="text-wishy-black font-bold text-lg mb-3">
                      All Wishes Between Us ({wishesBetweenUs.length})
                    </Text>
                    {wishesBetweenUs.length === 0 ? (
                      <View className="bg-wishy-paleBlush/30 rounded-xl p-6 items-center">
                        <Ionicons name="gift-outline" size={48} color="#9A8A8A" />
                        <Text className="text-wishy-gray mt-2 text-center">
                          No wishes shared yet
                        </Text>
                      </View>
                    ) : (
                      wishesBetweenUs.map((wish) => (
                        <WishCard key={wish.id} wish={wish} />
                      ))
                    )}
                  </Animated.View>
                )}
              </>
            )}

            {/* Wishlist Tab */}
            {selectedTab === "wishlist" && (
              <Animated.View
                entering={FadeInDown.delay(250).duration(400)}
                className="px-6 mb-6"
              >
                <Text className="text-wishy-black font-bold text-lg mb-3">
                  {user.name}&apos;s Wishlist ({userWishlist.length})
                </Text>
                <Text className="text-wishy-gray text-sm mb-4">
                  Wishes that {user.name} wants to experience
                </Text>
                {userWishlist.length === 0 ? (
                  <View className="bg-wishy-paleBlush/30 rounded-xl p-6 items-center">
                    <Ionicons name="heart-outline" size={48} color="#9A8A8A" />
                    <Text className="text-wishy-gray mt-2 text-center">
                      No wishes in wishlist
                    </Text>
                  </View>
                ) : (
                  userWishlist.map((wish) => <WishCard key={wish.id} wish={wish} />)
                )}
              </Animated.View>
            )}

            {/* Portfolio Tab */}
            {selectedTab === "portfolio" && (
              <Animated.View
                entering={FadeInDown.delay(250).duration(400)}
                className="px-6 mb-6"
              >
                <Text className="text-wishy-black font-bold text-lg mb-3">
                  {user.name}&apos;s Portfolio ({userPortfolio.length})
                </Text>
                <Text className="text-wishy-gray text-sm mb-4">
                  Wishes that {user.name} offers to fulfill
                </Text>
                {userPortfolio.length === 0 ? (
                  <View className="bg-wishy-paleBlush/30 rounded-xl p-6 items-center">
                    <Ionicons name="briefcase-outline" size={48} color="#9A8A8A" />
                    <Text className="text-wishy-gray mt-2 text-center">
                      No wishes in portfolio
                    </Text>
                  </View>
                ) : (
                  userPortfolio.map((wish) => <WishCard key={wish.id} wish={wish} />)
                )}
              </Animated.View>
            )}
          </>
        )}

        {/* Basic Info - Always visible */}
        {/* Interests */}
        {user.interests.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(isConnected ? 400 : 200).duration(400)}
            className="px-6 mb-6"
          >
            <Text className="text-wishy-black font-semibold mb-3">Interests</Text>
            <View className="flex-row flex-wrap gap-2">
              {user.interests.map((interest) => (
                <View
                  key={interest}
                  className="bg-white px-4 py-2 rounded-full border border-wishy-paleBlush"
                >
                  <Text className="text-wishy-black text-sm">{interest}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Photo Gallery */}
        {user.photoGallery.length > 0 &&
          (user.privacySettings.showGallery === "public" ||
            (isConnected && user.privacySettings.showGallery === "connections")) && (
            <Animated.View
              entering={FadeInDown.delay(isConnected ? 450 : 250).duration(400)}
              className="px-6 mb-6"
            >
              <Text className="text-wishy-black font-semibold mb-3">Gallery</Text>
              <View className="flex-row flex-wrap gap-2">
                {user.photoGallery.map((photo, index) => (
                  <View
                    key={index}
                    className="w-[31%] aspect-square rounded-xl overflow-hidden bg-wishy-paleBlush"
                  >
                    <Image
                      source={{ uri: photo }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

        {/* Contact Info */}
        {isConnected && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            className="px-6 mb-6"
          >
            <Text className="text-wishy-black font-semibold mb-3">Contact</Text>
            <View className="bg-white rounded-xl p-4 border border-wishy-paleBlush">
              <View className="flex-row items-center">
                <Ionicons name="mail" size={20} color="#8B2252" />
                <Text className="text-wishy-black ml-3">{user.email}</Text>
              </View>
              {user.location && user.privacySettings.showLocation && (
                <View className="flex-row items-center mt-3">
                  <Ionicons name="location" size={20} color="#8B2252" />
                  <Text className="text-wishy-black ml-3">{user.location}</Text>
                </View>
              )}
              {user.socialLinks?.instagram && (
                <Pressable
                  onPress={() => {
                    const instagram = user.socialLinks?.instagram;
                    if (!instagram) return;
                    const url = instagram.startsWith("http")
                      ? instagram
                      : `https://instagram.com/${instagram}`;
                    Linking.openURL(url);
                  }}
                  className="flex-row items-center mt-3 active:opacity-70"
                >
                  <Ionicons name="logo-instagram" size={20} color="#8B2252" />
                  <Text className="text-wishy-black ml-3 underline">
                    {user.socialLinks?.instagram}
                  </Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        )}

        {/* In a Relationship Section */}
        {userRelationships.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(isConnected ? 550 : 300).duration(400)}
            className="px-6 mb-6"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="heart" size={20} color="#8B2252" />
                <Text className="text-wishy-black font-semibold ml-2">
                  In a Relationship ({userRelationships.length})
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {userRelationships.map(({ connection, user: friend }) => {
                if (!friend) return null;

                return (
                  <Pressable
                    key={connection.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate("UserProfile", { userId: friend.id });
                    }}
                    className="items-center w-24 active:opacity-70"
                  >
                    <View className="w-20 h-20 rounded-full bg-wishy-paleBlush items-center justify-center overflow-hidden border-2 border-wishy-pink">
                      {friend.profilePhoto ? (
                        <Image
                          source={{ uri: friend.profilePhoto }}
                          style={{ width: 80, height: 80 }}
                          contentFit="cover"
                        />
                      ) : (
                        <Ionicons name="person" size={32} color="#8B2252" />
                      )}
                    </View>
                    <Text
                      className="text-wishy-black text-sm font-medium mt-2 text-center"
                      numberOfLines={2}
                    >
                      {friend.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="heart" size={10} color="#8B2252" />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>

      {/* Enlarged Photo Modal */}
      <Modal
        visible={showEnlargedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEnlargedPhoto(false)}
      >
        <Pressable
          onPress={() => setShowEnlargedPhoto(false)}
          className="flex-1 bg-black/90 items-center justify-center"
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="w-full px-6"
          >
            {user?.profilePhoto && (
              <Image
                source={{ uri: user.profilePhoto }}
                style={{ width: "100%", aspectRatio: 1, borderRadius: 20 }}
                contentFit="contain"
              />
            )}
          </Animated.View>

          <Pressable
            onPress={() => setShowEnlargedPhoto(false)}
            className="absolute top-12 right-6 w-10 h-10 bg-wishy-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
