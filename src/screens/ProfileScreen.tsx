import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

// Phase 4: Use new hooks instead of stores
import { useRepositories, useEventListeners } from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { batchEnrichWishes } from "../utils/enrichWishWithRecipients";
import { UserRole } from "../types/wishy";
import { cn } from "../utils/cn";
import { useProfileActions } from "./hooks/useProfileActions";
import { ProfileModals } from "./components/ProfileModals";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * ProfileScreen - Phase 4 Refactored Version
 *
 * Current user's profile with statistics and settings:
 * - useRepositories() for loading wishes, connections, and notifications
 * - useUserStore kept for auth and profile updates
 * - useEventListeners() for real-time updates
 * - All statistics calculations remain unchanged (data source only changes)
 */
export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const currentUser = useUserStore((s) => s.currentUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const logout = useUserStore((s) => s.logout);
  const deleteAccount = useUserStore((s) => s.deleteAccount);

  // Phase 4: Use hooks
  const repos = useRepositories()();

  // Data state
  const [wishes, setWishes] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // UI state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showEnlargedPhoto, setShowEnlargedPhoto] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const [w, c, n] = await Promise.all([
        repos.wishRepository.findAll(),
        repos.connectionRepository.findByUserId(currentUser.id),
        repos.notificationRepository?.findByUserId(currentUser.id) || Promise.resolve([]),
      ]);

      // Batch enrich wishes with recipient data (single query)
      const enrichedWishes = await batchEnrichWishes(w, repos.wishRecipientRepository);

      setWishes(enrichedWishes);
      setConnections(c.filter((conn: any) => conn.status === "accepted"));
      setNotifications(n || []);
    } catch (error) {
      console.error("[ProfileScreen] Error loading data:", error);
    }
  }, [currentUser?.id, repos.wishRepository, repos.connectionRepository, repos.notificationRepository, repos.wishRecipientRepository]);

  // Load on mount
  useEffect(() => {
    loadUserData();
  }, [currentUser?.id, loadUserData]);

  // Subscribe to updates
  useEventListeners({
    "wish.sent": () => loadUserData(),
    "wish.received": () => loadUserData(),
    "connection.accepted": () => loadUserData(),
    "notification.created": () => loadUserData(),
  });

  // Calculate from loaded data
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;
  const userRating = currentUser
    ? wishes
        .filter((w) => w.creatorId === currentUser.id && w.status === "fulfilled")
        .reduce((acc, w) => {
          const ratings = w.ratings || [];
          const avg = ratings.length > 0 ? ratings.reduce((a: any, b: any) => a + b, 0) / ratings.length : 0;
          return { 
            average: acc.average + avg, 
            praised: acc.praised + (ratings.length > 0 ? 1 : 0),
            total: acc.total + 1
          };
        }, { average: 0, praised: 0, total: 0 })
    : { average: 0, praised: 0, total: 0 };

  // Calculate wish statistics - LOGIC UNCHANGED
  const wishStats = React.useMemo(() => {
    if (!currentUser) return { forMe: 0, forOthers: 0, received: 0, fulfilled: 0, inProgress: 0 };

    const forMe = wishes.filter((wish) => {
      return wish.creatorId === currentUser.id && wish.creatorRole === "wished";
    });

    const forOthers = wishes.filter((wish) => {
      return wish.creatorId === currentUser.id && wish.creatorRole === "wisher";
    });

    const received = wishes.filter((wish) => {
      const isTargetedToMe =
        wish.targetUserId === currentUser.id ||
        (wish.targetUserIds && wish.targetUserIds.includes(currentUser.id));
      return (
        isTargetedToMe &&
        wish.creatorId !== currentUser.id
      );
    });

    const allMyWishes = [...forMe, ...forOthers, ...received];
    const fulfilled = allMyWishes.filter(w => w.status === "fulfilled").length;
    const inProgress = allMyWishes.filter(w => w.status === "accepted" || w.status === "sent").length;

    return {
      forMe: forMe.length,
      forOthers: forOthers.length,
      received: received.length,
      fulfilled,
      inProgress,
    };
  }, [currentUser, wishes]);

  // Use extracted actions hook
  const {
    handleLogout,
    confirmLogout,
    handleQRCode,
    handleChangePhoto,
    handleViewPhoto,
    handleTakePhoto,
    handleChoosePhoto,
    handleRemovePhoto,
    handleLogoPress,
    handleChangeRole,
    handleEditProfile,
    handleSettings,
    handleDeleteAccount,
    confirmDeleteAccount,
  } = useProfileActions({
    currentUser,
    updateUser,
    logout,
    deleteAccount,
    navigation,
    setShowPhotoModal,
    setShowEnlargedPhoto,
    setShowRoleModal,
    setShowDeleteModal,
    setShowLogoutModal,
  });

  if (!currentUser) {
    return (
      <View className="flex-1 bg-wishy-white items-center justify-center">
        <Text className="text-wishy-gray">No profile found</Text>
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

      <ScrollView
        style={{ paddingTop: insets.top }}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Profile Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        className="items-center pt-6 pb-8 px-6"
      >
        <Pressable onPress={handleViewPhoto} className="relative">
          <View className="w-28 h-28 rounded-full bg-wishy-paleBlush items-center justify-center overflow-hidden border-4 border-wishy-pink">
            {currentUser.profilePhoto ? (
              <Image
                source={{ uri: currentUser.profilePhoto }}
                style={{ width: 112, height: 112 }}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person" size={48} color="#8B2252" />
            )}
          </View>
          <Pressable
            onPress={handleChangePhoto}
            className="absolute bottom-0 right-0 bg-wishy-black w-9 h-9 rounded-full items-center justify-center border-2 border-wishy-white"
          >
            <Ionicons name="camera" size={18} color="#FFB6D9" />
          </Pressable>
        </Pressable>
        <Text className="text-wishy-black font-bold text-2xl mt-4">
          {currentUser.name}
        </Text>
        {currentUser.bio && (
          <Text className="text-wishy-gray text-center mt-2 px-4">
            {currentUser.bio}
          </Text>
        )}

        {/* Role Badge */}
        <View className="flex-row mt-4 space-x-2">
          <View className="bg-wishy-black px-4 py-2 rounded-full flex-row items-center">
            <Ionicons name="sparkles" size={16} color="#D4AF37" />
            <Text className="text-wishy-white font-medium ml-2 capitalize">
              {currentUser.role === "both" ? "Wisher & Wished" : currentUser.role}
            </Text>
          </View>
          {currentUser.isElite && (
            <View className="bg-wishy-darkPink px-4 py-2 rounded-full">
              <Text className="text-wishy-black font-medium">Elite</Text>
            </View>
          )}
        </View>

        {/* Rating Display */}
        {userRating.total > 0 && (
          <View className="mt-4 w-full bg-wishy-paleBlush px-6 py-4 rounded-2xl border-2 border-wishy-pink">
            <View className="flex-row items-center justify-center mb-2">
              <Ionicons name="sparkles" size={20} color="#8B2252" />
              <Text className="text-wishy-black font-bold text-lg ml-2">
                Your Satisfaction Rating
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

        {/* Wishy Journey Statistics */}
        <View className="mt-4 w-full bg-white px-6 py-4 rounded-2xl border-2 border-wishy-paleBlush">
          <View className="flex-row items-center justify-center mb-4">
            <Ionicons name="stats-chart" size={20} color="#8B2252" />
            <Text className="text-wishy-black font-bold text-lg ml-2">
              Your Wishy Journey
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 bg-wishy-paleBlush/30 p-3 rounded-xl min-w-[45%]">
              <Text className="text-wishy-black font-bold text-2xl text-center">{wishStats.fulfilled}</Text>
              <Text className="text-wishy-gray text-xs text-center mt-1">Fulfilled</Text>
            </View>
            <View className="flex-1 bg-wishy-paleBlush/30 p-3 rounded-xl min-w-[45%]">
              <Text className="text-wishy-black font-bold text-2xl text-center">{wishStats.inProgress}</Text>
              <Text className="text-wishy-gray text-xs text-center mt-1">In Progress</Text>
            </View>
            <View className="flex-1 bg-wishy-paleBlush/30 p-3 rounded-xl min-w-[45%]">
              <Text className="text-wishy-black font-bold text-2xl text-center">{wishStats.forMe}</Text>
              <Text className="text-wishy-gray text-xs text-center mt-1">For Me</Text>
            </View>
            <View className="flex-1 bg-wishy-paleBlush/30 p-3 rounded-xl min-w-[45%]">
              <Text className="text-wishy-black font-bold text-2xl text-center">{wishStats.forOthers}</Text>
              <Text className="text-wishy-gray text-xs text-center mt-1">For Others</Text>
            </View>
            <View className="flex-1 bg-wishy-paleBlush/30 p-3 rounded-xl min-w-[45%]">
              <Text className="text-wishy-black font-bold text-2xl text-center">{wishStats.received}</Text>
              <Text className="text-wishy-gray text-xs text-center mt-1">Received</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Interests */}
      {currentUser.interests.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="px-6 mb-6"
        >
          <Text className="text-wishy-black font-semibold mb-3">Interests</Text>
          <View className="flex-row flex-wrap gap-2">
            {currentUser.interests.map((interest) => (
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

      {/* Actions */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(400)}
        className="px-6"
      >
        <Text className="text-wishy-black font-semibold mb-3">Quick Actions</Text>

        {/* Notifications */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("Notifications");
          }}
          className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between border border-wishy-paleBlush active:opacity-80"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 bg-wishy-paleBlush rounded-full items-center justify-center mr-3">
              <Ionicons name="notifications" size={20} color="#4A1528" />
            </View>
            <Text className="text-wishy-black font-medium text-base">Notifications</Text>
          </View>
          <View className="flex-row items-center">
            {unreadNotifications > 0 && (
              <View className="bg-wishy-pink px-2 py-0.5 rounded-full mr-2">
                <Text className="text-wishy-black text-xs font-semibold">
                  {unreadNotifications}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#9A8A8A" />
          </View>
        </Pressable>

        {/* Edit Profile */}
        <Pressable
          onPress={handleEditProfile}
          className="bg-white rounded-xl p-4 flex-row items-center mb-3 active:opacity-95 border border-wishy-paleBlush"
        >
          <View className="w-10 h-10 bg-wishy-paleBlush rounded-xl items-center justify-center">
            <Ionicons name="create-outline" size={22} color="#8B2252" />
          </View>
          <Text className="flex-1 text-wishy-black font-medium ml-3">
            Edit Profile
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9A8A8A" />
        </Pressable>

        {/* Change Role Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowRoleModal(true);
          }}
          className="bg-white rounded-xl p-4 flex-row items-center mb-3 active:opacity-95 border border-wishy-paleBlush"
        >
          <View className="w-10 h-10 bg-wishy-paleBlush rounded-xl items-center justify-center">
            <Ionicons name="person-outline" size={22} color="#8B2252" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-wishy-black font-medium">
              Change Role
            </Text>
            <Text className="text-wishy-gray text-xs mt-0.5">
              Currently: {currentUser.role === "both" ? "Wisher & Wished" : currentUser.role}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9A8A8A" />
        </Pressable>

        <Pressable
          onPress={handleQRCode}
          className="bg-white rounded-xl p-4 flex-row items-center mb-3 active:opacity-95"
        >
          <View className="w-10 h-10 bg-wishy-paleBlush rounded-xl items-center justify-center">
            <Ionicons name="qr-code" size={22} color="#8B2252" />
          </View>
          <Text className="flex-1 text-wishy-black font-medium ml-3">
            My QR Code
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9A8A8A" />
        </Pressable>

        <Pressable
          onPress={handleSettings}
          className="bg-white rounded-xl p-4 flex-row items-center mb-3 active:opacity-95 border border-wishy-paleBlush"
        >
          <View className="w-10 h-10 bg-wishy-paleBlush rounded-xl items-center justify-center">
            <Ionicons name="settings-outline" size={22} color="#8B2252" />
          </View>
          <Text className="flex-1 text-wishy-black font-medium ml-3">
            Search Settings
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9A8A8A" />
        </Pressable>

        <Pressable
          className="bg-white rounded-xl p-4 flex-row items-center mb-3 active:opacity-95 border border-wishy-paleBlush"
        >
          <View className="w-10 h-10 bg-wishy-paleBlush rounded-xl items-center justify-center">
            <Ionicons name="shield-outline" size={22} color="#8B2252" />
          </View>
          <Text className="flex-1 text-wishy-black font-medium ml-3">
            Privacy
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9A8A8A" />
        </Pressable>

        <Pressable
          className="bg-white rounded-xl p-4 flex-row items-center active:opacity-95"
        >
          <View className="w-10 h-10 bg-wishy-paleBlush rounded-xl items-center justify-center">
            <Ionicons name="help-circle-outline" size={22} color="#8B2252" />
          </View>
          <Text className="flex-1 text-wishy-black font-medium ml-3">
            Help & Support
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9A8A8A" />
        </Pressable>

        {/* Push Debug - for testing */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("PushDebug");
          }}
          className="bg-gray-100 rounded-xl p-4 flex-row items-center mt-3 active:opacity-95 border border-gray-200"
        >
          <View className="w-10 h-10 bg-gray-200 rounded-xl items-center justify-center">
            <Ionicons name="bug-outline" size={22} color="#666" />
          </View>
          <Text className="flex-1 text-gray-700 font-medium ml-3">
            Push Debug
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9A8A8A" />
        </Pressable>
      </Animated.View>

      {/* Logout */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        className="px-6 mt-8"
      >
        <Pressable
          onPress={handleLogout}
          className="py-4 rounded-xl items-center border border-wishy-pink active:opacity-90 mb-3"
        >
          <Text className="text-wishy-black font-semibold">Log Out</Text>
        </Pressable>

        {/* Delete Account */}
        <Pressable
          onPress={handleDeleteAccount}
          className="py-4 rounded-xl items-center border-2 border-red-200 bg-red-50 active:opacity-90"
        >
          <Text className="text-red-600 font-semibold">Delete Account</Text>
        </Pressable>
      </Animated.View>

      {/* Modals */}
      <ProfileModals
        currentUser={currentUser}
        showPhotoModal={showPhotoModal}
        setShowPhotoModal={setShowPhotoModal}
        onTakePhoto={handleTakePhoto}
        onChoosePhoto={handleChoosePhoto}
        onRemovePhoto={handleRemovePhoto}
        showEnlargedPhoto={showEnlargedPhoto}
        setShowEnlargedPhoto={setShowEnlargedPhoto}
        showRoleModal={showRoleModal}
        setShowRoleModal={setShowRoleModal}
        onChangeRole={handleChangeRole}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        onConfirmDelete={confirmDeleteAccount}
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
        onConfirmLogout={handleLogout}
      />
    </ScrollView>
    </View>
  );
}
