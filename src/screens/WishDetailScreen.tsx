/**
 * WishDetailScreen - REFACTORED VERSION
 *
 * Organized into clear sections:
 * 1. SETUP - navigation, routes, hooks
 * 2. STATE - all useState hooks organized by type
 * 3. DATA LOADING - useEffect for data fetching
 * 4. EVENT LISTENERS - useEventListeners for real-time updates
 * 5. COMPUTED VALUES - useMemo for derived data
 * 6. HANDLERS - all callback functions
 * 7. RENDER LOGIC - conditional rendering and JSX
 * 8. MODALS - all modal components
 *
 * This pattern makes the component:
 * - Easier to navigate and understand
 * - Clear about data flow and side effects
 * - Simple to add new functionality
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import DateTimePicker from "@react-native-community/datetimepicker";

// Phase 4: Use new hooks instead of stores
import {
  useWishUseCases,
  useConnectionUseCases,
  useRepositories,
  useEventListeners,
} from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { useToastStore } from "../state/toastStore";
import { enrichSingleWish } from "../utils/enrichWishWithRecipients";

// Types & utilities
import { CATEGORY_LABELS, WISH_STATUS_LABELS, User, Wish } from "../types/wishy";
import { cn } from "../utils/cn";
import { WishOriginBadge } from "../components/WishOriginBadge";
import { WishDirectionIndicator } from "../components/WishDirectionIndicator";

// Custom hooks for orchestration
import { useWishDetailComputed } from "./hooks/useWishDetailComputed";
import { useWishDetailModals } from "./hooks/useWishDetailModals";
import { useWishDetailActions } from "./hooks/useWishDetailActions";
import { WishDetailModals } from "./components/WishDetailModals";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "WishDetail">;
type WishDetailRouteProp = RouteProp<RootStackParamList, "WishDetail">;

export default function WishDetailScreen() {
  // ==================== SETUP ====================
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WishDetailRouteProp>();
  const wishId = route.params.wishId;

  // Hooks
  const useCases = useWishUseCases()();
  const connectionUseCases = useConnectionUseCases()();
  const repositories = useRepositories()();
  const showToast = useToastStore((s) => s.showToast);
  const currentUser = useUserStore((s) => s.currentUser);
  const allUsers = useUserStore((s) => s.allUsers);

  // ==================== STATE ====================
  // Wish Data
  const [wish, setWish] = useState<Wish | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);

  // Use custom hooks for modals, form state, computed values, and actions
  const modals = useWishDetailModals();
  const {
    showDateModal, setShowDateModal,
    showDeclineModal, setShowDeclineModal,
    showDeleteModal, setShowDeleteModal,
    showRatingModal, setShowRatingModal,
    showSendToModal, setShowSendToModal,
    showEditDateModal, setShowEditDateModal,
    proposedDate, setProposedDate,
    editDate, setEditDate,
    proposalMessage, setProposalMessage,
    rating, setRating,
    praised, setPraised,
    review, setReview,
    selectedUserIds, setSelectedUserIds,
    showDatePicker, setShowDatePicker,
    showTimePicker, setShowTimePicker,
    showEditDatePicker, setShowEditDatePicker,
    showEditTimePicker, setShowEditTimePicker,
  } = modals;

  // ==================== DATA LOADING ====================
  useEffect(() => {
    const loadWish = async () => {
      try {
        setLoading(true);
        const w = await repositories.wishRepository.findById(wishId);
        
        if (!w) {
          setWish(null);
          return;
        }

        // Enrich wish with recipient data
        const enrichedWish = await enrichSingleWish(w, repositories.wishRecipientRepository);
        
        setWish(enrichedWish);
      } catch (error) {
        console.error("[WishDetailScreen] Error loading wish:", error);
        showToast("Error loading wish", "error");
      } finally {
        setLoading(false);
      }
    };

    loadWish();
  }, [wishId, repositories.wishRepository, repositories.wishRecipientRepository, showToast]);

  // Load connections
  useEffect(() => {
    const loadConnections = async () => {
      if (!currentUser) return;
      try {
        const conns = await repositories.connectionRepository.findByUserId(currentUser.id);
        setConnections(conns);
      } catch (error) {
        console.error("[WishDetailScreen] Error loading connections:", error);
      }
    };

    loadConnections();
  }, [currentUser, repositories.connectionRepository]);

  // Helper function to load and enrich wish with recipients
  const loadAndEnrichWish = useCallback(
    async (id: string) => {
      try {
        const w = await repositories.wishRepository.findById(id);
        if (!w) {
          setWish(null);
          return;
        }

        const enrichedWish = await enrichSingleWish(w, repositories.wishRecipientRepository);
        setWish(enrichedWish);
      } catch (error) {
        console.error("[WishDetailScreen] Error enriching wish:", error);
      }
    },
    [repositories.wishRepository, repositories.wishRecipientRepository]
  );

  // ==================== EVENT LISTENERS ====================
  useEventListeners({
    "wish.sent": (event) => {
      if (event.wishId === wishId) {
        loadAndEnrichWish(wishId);
      }
    },
    "wish.accepted": (event) => {
      if (event.wishId === wishId) {
        loadAndEnrichWish(wishId);
      }
    },
    "wish.declined": (event) => {
      if (event.wishId === wishId) {
        showToast("This wish was declined", "info");
        setTimeout(() => navigation.goBack(), 500);
      }
    },
    "wish.deleted": (event) => {
      if (event.wishId === wishId) {
        showToast("This wish was deleted", "info");
        setTimeout(() => navigation.goBack(), 500);
      }
    },
    "wish.dateProposed": (event) => {
      if (event.wishId === wishId) {
        loadAndEnrichWish(wishId);
      }
    },
    "wish.dateConfirmed": (event) => {
      if (event.wishId === wishId) {
        loadAndEnrichWish(wishId);
      }
    },
    "wish.fulfilled": (event) => {
      if (event.wishId === wishId) {
        loadAndEnrichWish(wishId);
      }
    },
  });

  // ==================== COMPUTED VALUES (via custom hook) ====================
  const { connectedUsers, targets, isOwnWish, creator, target, isWished, canSendToUser } =
    useWishDetailComputed(wish, currentUser, allUsers, connections);

  // ==================== ACTIONS (via custom hook) ====================
  const actions = useWishDetailActions(
    wishId,
    wish,
    currentUser,
    useCases,
    connectionUseCases,
    showToast,
    navigation,
    modals.setShowDateModal,
    modals.setShowDeclineModal,
    modals.setShowDeleteModal,
    modals.setShowRatingModal,
    modals.setShowSendToModal,
    modals.setShowEditDateModal,
    modals.proposedDate,
    modals.editDate,
    modals.proposalMessage,
    modals.rating,
    modals.praised,
    modals.review,
    modals.selectedUserIds,
    modals.setProposalMessage,
    modals.setRating,
    modals.setPraised,
    modals.setReview,
    modals.setSelectedUserIds
  );

  // ==================== HANDLERS (delegated to useWishDetailActions) ====================
  // All handlers are now in actions.handleXxx - see useWishDetailActions.ts
  // Destructure for convenience in JSX:
  const {
    handleAcceptWish,
    handleProposeDate,
    handleDeclineWish,
    handleDeleteWish,
    handleFulfillWish,
    handleUpdateDate,
    handleConfirmDate,
    handleSendToUsers,
    handleOpenMaps,
    handleOpenChat,
  } = actions;

  // ==================== RENDER LOGIC ====================

  if (loading) {
    return (
      <View className="flex-1 bg-wishy-white items-center justify-center">
        <Text className="text-wishy-gray">Loading wish...</Text>
      </View>
    );
  }

  if (!wish) {
    return (
      <View className="flex-1 bg-wishy-white items-center justify-center">
        <Text className="text-wishy-gray">Wish not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-wishy-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Image */}
        <View className="relative">
          {wish.imageUrl ? (
            <Image
              source={{ uri: wish.imageUrl }}
              style={{ width: "100%", height: 320 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-full h-80 bg-wishy-paleBlush items-center justify-center">
              <Ionicons name="image-outline" size={64} color="#8B2252" />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(74,21,40,0.8)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 120,
            }}
          />
          <Pressable
            onPress={() => navigation.goBack()}
            className="absolute top-12 left-4 w-10 h-10 bg-black/30 rounded-full items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#FFF8F0" />
          </Pressable>
          {canSendToUser && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowSendToModal(true);
              }}
              className="absolute top-12 right-4 bg-wishy-pink/95 rounded-full px-4 py-2 flex-row items-center active:opacity-80"
            >
              <Ionicons name="paper-plane" size={16} color="#4A1528" />
              <Text className="text-wishy-black font-semibold text-sm ml-1.5">
                Send to
              </Text>
            </Pressable>
          )}
        </View>

        {/* Content */}
        <View className="px-6 -mt-8 pb-8">
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <View className="bg-white rounded-2xl p-5 shadow-sm">
              {/* Origin Badge */}
              <WishOriginBadge
                createdByMe={isOwnWish}
                isWished={isWished}
                proposedByUserName={creator?.name}
                className="mb-3"
              />

              {/* Category and Status */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="bg-wishy-paleBlush px-3 py-1 rounded-full">
                  <Text className="text-wishy-black text-sm font-medium">
                    {CATEGORY_LABELS[wish.category]}
                  </Text>
                </View>
                <View
                  className={cn(
                    "px-3 py-1 rounded-full",
                    wish.status === "fulfilled"
                      ? "bg-wishy-darkPink"
                      : wish.status === "confirmed"
                        ? "bg-wishy-pink"
                        : wish.status === "date_set"
                          ? "bg-wishy-pink"
                          : wish.status === "accepted"
                            ? "bg-wishy-pink"
                            : wish.status === "sent"
                              ? "bg-wishy-paleBlush"
                              : wish.status === "rejected"
                                ? "bg-black"
                                : "bg-gray-100"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-medium",
                      wish.status === "fulfilled"
                        ? "text-white"
                        : wish.status === "confirmed"
                          ? "text-white"
                          : wish.status === "date_set"
                            ? "text-white"
                            : wish.status === "accepted"
                              ? "text-white"
                              : wish.status === "sent"
                                ? "text-wishy-darkPink"
                                : wish.status === "rejected"
                                  ? "text-white"
                                  : "text-wishy-gray"
                    )}
                  >
                    {WISH_STATUS_LABELS[wish.status] || wish.status}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text className="text-wishy-black font-bold text-2xl">
                {wish.title}
              </Text>

              {/* Description */}
              <Text className="text-wishy-gray mt-3 text-base leading-6">
                {wish.description}
              </Text>

              {/* Rating Section - Only show when fulfilled */}
              {wish.status === "fulfilled" && wish.rating !== undefined && (
                <Animated.View
                  entering={FadeInUp.delay(250).duration(400)}
                  className="mt-5 p-4 bg-wishy-paleBlush/30 rounded-2xl"
                >
                  <Text className="text-wishy-black font-bold text-lg mb-3 text-center">
                    Experience Rating
                  </Text>

                  {/* Magic Wands Display */}
                  <View className="flex-row justify-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((wand) => (
                      <Ionicons
                        key={wand}
                        name="sparkles"
                        size={28}
                        color={
                          wish.rating && wish.rating >= wand
                            ? "#8B2252"
                            : "#D1D5DB"
                        }
                      />
                    ))}
                  </View>

                  {/* Heart/Praise */}
                  {wish.praised && (
                    <View className="flex-row items-center justify-center mb-2">
                      <Ionicons name="heart" size={20} color="#8B2252" />
                      <Text className="text-wishy-darkPink font-semibold ml-2">
                        Special Praise
                      </Text>
                    </View>
                  )}

                  {/* Review Text */}
                  {wish.review && wish.review.trim() !== "" && (
                    <View className="mt-3 pt-3 border-t border-wishy-pink/20">
                      <Text className="text-wishy-gray text-sm italic text-center">
                        {`"${wish.review}"`}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              )}

              {/* Details */}
              <View className="mt-5 pt-5 border-t border-wishy-paleBlush">
                {wish.location && (
                  <Pressable
                    onPress={handleOpenMaps}
                    className="flex-row items-center mb-3 active:opacity-70"
                  >
                    <Ionicons name="location-outline" size={20} color="#8B2252" />
                    <Text className="text-wishy-black ml-2 underline">
                      {wish.location}
                    </Text>
                    <Ionicons
                      name="open-outline"
                      size={16}
                      color="#8B2252"
                      className="ml-1"
                    />
                  </Pressable>
                )}
                {wish.links && wish.links.length > 0 && (
                  <View className="mb-3">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="link-outline" size={20} color="#8B2252" />
                      <Text className="text-wishy-black ml-2 font-semibold">
                        Links
                      </Text>
                    </View>
                    {wish.links.map((link, index) => (
                      <Pressable
                        key={index}
                        onPress={() => Linking.openURL(link)}
                        className="ml-7 mb-1 active:opacity-70"
                      >
                        <Text
                          className="text-blue-600 underline"
                          numberOfLines={1}
                        >
                          {link}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {wish.customCategory && (
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="pricetag-outline" size={20} color="#8B2252" />
                    <Text className="text-wishy-black ml-2">
                      {wish.customCategory}
                    </Text>
                  </View>
                )}
              </View>

              {/* Proposed Date Info */}
              {wish.proposal && (
                <View className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="calendar" size={20} color="#1E40AF" />
                    <Text className="text-blue-900 font-semibold ml-2">
                      {wish.proposal.confirmedBy
                        ? "Confirmed Date"
                        : "Proposed Date"}
                    </Text>
                  </View>
                  <Text className="text-blue-800 ml-7">
                    {wish.proposal.proposedDate} at {wish.proposal.proposedTime}
                  </Text>
                  {wish.proposal.proposalMessage && (
                    <Text className="text-blue-700 text-sm mt-2 ml-7 italic">
                      {wish.proposal.proposalMessage}
                    </Text>
                  )}

                  {/* Confirm button */}
                  {wish.status === "date_set" &&
                    (wish.targetUserId === currentUser?.id ||
                      wish.targetUserIds?.includes(currentUser?.id || "") ||
                      wish.creatorId === currentUser?.id) &&
                    wish.proposal.proposedBy !== currentUser?.id && (
                      <View className="mt-3">
                        <Pressable
                          onPress={handleConfirmDate}
                          disabled={isLoadingAction}
                          className="flex-row items-center justify-center bg-green-500 px-4 py-3 rounded-lg active:opacity-80 disabled:opacity-60"
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color="#FFFFFF"
                          />
                          <Text className="text-white font-semibold ml-2">
                            Confirm Date
                          </Text>
                        </Pressable>
                      </View>
                    )}

                  {(wish.status === "confirmed" || wish.status === "fulfilled") && (
                    <View className="flex-row items-center mt-2 ml-7">
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#059669"
                      />
                      <Text className="text-green-700 text-sm ml-1">
                        Date confirmed
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.View>

          {/* Direction Indicator */}
          <Animated.View
            entering={FadeInUp.delay(150).duration(400)}
            className="mt-4"
          >
            <WishDirectionIndicator
              creator={creator}
              target={target}
              targets={targets.length > 0 ? targets : undefined}
              creatorRole={wish.creatorRole}
            />
          </Animated.View>

          {/* Tags */}
          {wish.tags && wish.tags.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(200).duration(400)}
              className="mt-4"
            >
              <View className="flex-row flex-wrap gap-2">
                {wish.tags.map((tag) => (
                  <View
                    key={tag}
                    className="bg-wishy-paleBlush/50 px-3 py-1 rounded-full"
                  >
                    <Text className="text-wishy-black text-sm">#{tag}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons - CREATOR */}
      {isOwnWish && wish.status !== "created" && wish.status !== "fulfilled" && (
        <Animated.View
          entering={FadeInUp.delay(300).duration(400)}
          className="bg-white border-t border-wishy-paleBlush"
          style={{
            paddingBottom: insets.bottom + 16,
            paddingTop: 16,
            paddingHorizontal: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View className="gap-3">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("CreateWish", {
                  mode: wish.creatorRole === "wished" ? "wishlist" : "portfolio",
                  editWishId: wishId,
                });
              }}
              disabled={isLoadingAction}
              className="bg-wishy-darkPink py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 disabled:opacity-60"
            >
              <Ionicons name="pencil" size={22} color="#000000" />
              <Text className="text-black font-bold text-base ml-2">Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEditDateModal(true);
              }}
              disabled={isLoadingAction}
              className="bg-wishy-pink py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 disabled:opacity-60"
            >
              <Ionicons name="calendar-outline" size={22} color="#000000" />
              <Text className="text-black font-semibold text-base ml-2">
                Propose Date
              </Text>
            </Pressable>

            <Pressable
              onPress={handleOpenChat}
              disabled={isLoadingAction}
              className="bg-wishy-paleBlush py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 disabled:opacity-60"
            >
              <Ionicons name="chatbubble-outline" size={22} color="#000000" />
              <Text className="text-black font-semibold text-base ml-2">
                Open Chat
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowDeleteModal(true)}
              disabled={isLoadingAction}
              className="bg-gray-50 border border-gray-200 py-4 rounded-2xl flex-row items-center justify-center active:opacity-70 disabled:opacity-60"
            >
              <Ionicons name="trash-outline" size={20} color="#000000" />
              <Text className="text-black font-semibold text-sm ml-2">
                Delete
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Action Buttons - RECEIVER */}
      {!isOwnWish && (
        <Animated.View
          entering={FadeInUp.delay(300).duration(400)}
          className="bg-white border-t border-wishy-paleBlush"
          style={{
            paddingBottom: insets.bottom + 16,
            paddingTop: 16,
            paddingHorizontal: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View className="gap-3">
            {wish.status === "sent" && (
              <Pressable
                onPress={handleAcceptWish}
                disabled={isLoadingAction}
                className="bg-wishy-darkPink py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 disabled:opacity-60"
              >
                <Ionicons name="checkmark-circle" size={22} color="#000000" />
                <Text className="text-black font-bold text-base ml-2">
                  Accept
                </Text>
              </Pressable>
            )}

            {wish.status === "confirmed" && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRating(0);
                  setPraised(false);
                  setReview("");
                  setShowRatingModal(true);
                }}
                disabled={isLoadingAction}
                className="bg-green-500 py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 disabled:opacity-60"
              >
                <Ionicons name="star" size={22} color="#FFFFFF" />
                <Text className="text-white font-bold text-base ml-2">
                  Fulfilled
                </Text>
              </Pressable>
            )}

            {(wish.status === "accepted" ||
              wish.status === "date_set" ||
              wish.status === "confirmed") && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditDate(new Date());
                  setShowEditDateModal(true);
                }}
                disabled={isLoadingAction}
                className="bg-wishy-pink py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 disabled:opacity-60"
              >
                <Ionicons name="calendar-outline" size={22} color="#000000" />
                <Text className="text-black font-semibold text-base ml-2">
                  Propose Date
                </Text>
              </Pressable>
            )}

            {wish.status !== "fulfilled" && (
              <Pressable
                onPress={handleOpenChat}
                disabled={isLoadingAction}
                className="bg-wishy-paleBlush py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 disabled:opacity-60"
              >
                <Ionicons name="chatbubble-outline" size={22} color="#000000" />
                <Text className="text-black font-semibold text-base ml-2">
                  Open Chat
                </Text>
              </Pressable>
            )}

            {wish.status === "fulfilled" && (
              <Pressable
                onPress={handleOpenChat}
                disabled={isLoadingAction}
                className="bg-wishy-pink py-4 rounded-2xl flex-row items-center justify-center active:opacity-80 disabled:opacity-60"
              >
                <Ionicons name="chatbubble-outline" size={22} color="#000000" />
                <Text className="text-black font-semibold text-base ml-2">
                  Open Chat
                </Text>
              </Pressable>
            )}

            {wish.status === "sent" && (
              <Pressable
                onPress={() => setShowDeclineModal(true)}
                disabled={isLoadingAction}
                className="bg-gray-50 border border-gray-200 py-4 rounded-2xl flex-row items-center justify-center active:opacity-70 disabled:opacity-60"
              >
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color="#DC2626"
                />
                <Text className="text-red-600 font-semibold text-sm ml-2">
                  Decline
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowDeleteModal(true)}
              disabled={isLoadingAction}
              className="bg-gray-50 border border-gray-200 py-4 rounded-2xl flex-row items-center justify-center active:opacity-70 disabled:opacity-60"
            >
              <Ionicons name="trash-outline" size={20} color="#000000" />
              <Text className="text-black font-semibold text-sm ml-2">
                Delete
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Modals */}
      <WishDetailModals
        wish={wish}
        modalState={modals}
        isOwnWish={!!isOwnWish}
        isLoadingAction={isLoadingAction}
        connectedUsers={connectedUsers}
        currentUser={currentUser}
        bottomInset={insets.bottom}
        onProposeDate={handleProposeDate}
        onDeclineWish={handleDeclineWish}
        onDeleteWish={handleDeleteWish}
        onFulfillWish={handleFulfillWish}
        onUpdateDate={handleUpdateDate}
        onSendToUsers={handleSendToUsers}
      />
    </View>
  );
}
