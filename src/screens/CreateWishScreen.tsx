/**
 * CreateWishScreen - Phase 4 Refactored Version
 *
 * This version uses domain use cases instead of Zustand stores.
 * The business logic is now in the application layer.
 * This screen handles UI presentation and event handling.
 *
 * Key changes:
 * - useWishUseCases() replaces direct store calls
 * - useEventListener() subscribes to domain events
 * - Local state for form, event-driven state updates for wishes
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";

// Phase 4: Use hooks instead of stores
import { useWishUseCases, useEventListener, useRepositories } from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { useToastStore } from "../state/toastStore";

import { WishCategory, CATEGORY_LABELS } from "../types/wishy";
import { cn } from "../utils/cn";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { sendWishReceivedNotification } from "../api/pushNotifications";
import { useCreateWishActions } from "./hooks/useCreateWishActions";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateWish">;
type CreateWishRouteProp = RouteProp<RootStackParamList, "CreateWish">;

const CATEGORIES: WishCategory[] = [
  "dining",
  "travel",
  "experience",
  "gift",
  "entertainment",
  "wellness",
  "adventure",
  "romantic",
  "custom",
];

export default function CreateWishScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateWishRouteProp>();
  const initialMode = route.params?.mode || "wishlist";
  const editWishId = route.params?.editWishId;

  // Phase 4: Use hooks instead of stores
  const useCases = useWishUseCases()();
  const repos = useRepositories()();
  const showToast = useToastStore((s) => s.showToast);
  const currentUser = useUserStore((s) => s.currentUser);
  const allUsers = useUserStore((s) => s.allUsers);

  // State for connected users
  const [connectedUsers, setConnectedUsers] = React.useState<any[]>([]);

  const existingWish = undefined; // useWishRepository().findById(editWishId)
  const isEditMode = !!existingWish;

  // Form state
  const [title, setTitle] = useState(existingWish?.title || "");
  const [description, setDescription] = useState(
    existingWish?.description || ""
  );
  const [category, setCategory] = useState<WishCategory>(
    existingWish?.category || "experience"
  );
  const [customCategory, setCustomCategory] = useState(
    existingWish?.customCategory || ""
  );
  const [image, setImage] = useState<string | undefined>(
    existingWish?.imageUrl
  );
  const [location, setLocation] = useState(existingWish?.location || "");
  const [locationPlaceId, setLocationPlaceId] = useState<string | undefined>(
    undefined
  );
  const [links, setLinks] = useState<string[]>(
    existingWish?.links && existingWish.links.length > 0
      ? existingWish.links
      : [""]
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    existingWish?.targetUserIds ||
      (existingWish?.targetUserId ? [existingWish.targetUserId] : [])
  );
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = React.useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load connected users from repository
  React.useEffect(() => {
    const loadConnectedUsers = async () => {
      if (!currentUser) return;
      try {
        const connections = await repos.connectionRepository.findByUserId(currentUser.id);
        const acceptedConnections = connections.filter((c) => c.status === "accepted");
        const connected = acceptedConnections.flatMap((conn) => {
          const otherUserId =
            conn.senderId === currentUser.id ? conn.receiverId : conn.senderId;
          const user = allUsers.find((u) => u.id === otherUserId);
          return user ? [user] : [];
        });
        setConnectedUsers(connected);
      } catch (error) {
        console.error("[CreateWishScreen] Error loading connected users:", error);
      }
    };
    loadConnectedUsers();
  }, [currentUser, allUsers, repos.connectionRepository]);

  // Subscribe to wish created event
  useEventListener("wish.sent", (event) => {
    console.log("[CreateWishScreen] Wish sent event:", event);
    showToast("✓ Wish created!", "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate back after short delay
    setTimeout(() => {
      navigation.goBack();
    }, 500);
  });

  // Use extracted actions hook
  const {
    handleCreate,
    handleTakePhoto,
    handlePickFromLibrary,
    capturePhoto,
    handleAddLink,
    handleRemoveLink,
    handleLinkChange,
    handleRemoveImage,
  } = useCreateWishActions({
    title,
    description,
    category,
    customCategory,
    image,
    links,
    location,
    selectedUserIds,
    isEditMode,
    existingWish,
    currentUser,
    useCases,
    showToast,
    navigation,
    setImage,
    setLinks,
    setIsLoading,
    setShowImagePicker,
    setShowCamera,
    cameraRef,
    cameraPermission,
    requestCameraPermission,
  });

  const isValid =
    title.trim().length > 0 &&
    (category !== "custom" || customCategory.trim().length > 0);

  // Camera View
  if (showCamera) {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
          <View
            style={{ paddingTop: insets.top }}
            className="absolute top-0 left-0 right-0 z-10"
          >
            <View className="flex-row items-center justify-between px-4 py-3">
              <Pressable
                onPress={() => setShowCamera(false)}
                className="w-10 h-10 items-center justify-center bg-black/50 rounded-full"
              >
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() =>
                  setFacing(facing === "back" ? "front" : "back")
                }
                className="w-10 h-10 items-center justify-center bg-black/50 rounded-full"
              >
                <Ionicons name="camera-reverse" size={24} color="#fff" />
              </Pressable>
            </View>
          </View>
          <View
            style={{ paddingBottom: insets.bottom + 20 }}
            className="absolute bottom-0 left-0 right-0 items-center"
          >
            <Pressable
              onPress={capturePhoto}
              className="w-20 h-20 rounded-full bg-white border-4 border-wishy-pink"
            />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-wishy-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.top + 44}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Picker */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Pressable
            onPress={() => setShowImagePicker(true)}
            className="bg-white rounded-2xl overflow-hidden border border-wishy-paleBlush mb-6"
          >
            {image ? (
              <View>
                <Image
                  source={{ uri: image }}
                  style={{ width: "100%", height: 200 }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={handleRemoveImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View className="h-48 items-center justify-center">
                <Ionicons name="image-outline" size={48} color="#9A8A8A" />
                <Text className="text-wishy-gray mt-2">Add a cover image</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text className="text-wishy-black font-semibold mb-2">Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What do you wish for?"
            placeholderTextColor="#9A8A8A"
            className="bg-white p-4 rounded-xl text-wishy-black text-base border border-wishy-paleBlush"
            editable={!isLoading}
          />
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mt-4">
          <Text className="text-wishy-black font-semibold mb-2">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your wish in detail..."
            placeholderTextColor="#9A8A8A"
            multiline
            numberOfLines={4}
            className="bg-white p-4 rounded-xl text-wishy-black text-base border border-wishy-paleBlush min-h-[100px]"
            textAlignVertical="top"
            editable={!isLoading}
          />
        </Animated.View>

        {/* Category */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} className="mt-4">
          <Text className="text-wishy-black font-semibold mb-3">Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(cat);
                }}
                disabled={isLoading}
                className={cn(
                  "px-4 py-2 rounded-full",
                  category === cat
                    ? "bg-wishy-black"
                    : "bg-white border border-wishy-paleBlush"
                )}
              >
                <Text
                  className={cn(
                    "text-sm font-medium",
                    category === cat
                      ? "text-wishy-white"
                      : "text-wishy-black"
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Custom Category */}
        {category === "custom" && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            className="mt-4"
          >
            <Text className="text-wishy-black font-semibold mb-2">
              Custom Category *
            </Text>
            <TextInput
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Enter category name"
              placeholderTextColor="#9A8A8A"
              className="bg-white p-4 rounded-xl text-wishy-black text-base border border-wishy-paleBlush"
              editable={!isLoading}
            />
          </Animated.View>
        )}

        {/* Location */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          className="mt-4"
        >
          <Text className="text-wishy-black font-semibold mb-2">
            Location (optional)
          </Text>
          <LocationAutocomplete
            value={location}
            onChangeText={setLocation}
            onSelectLocation={(loc, placeId) => {
              setLocation(loc);
              setLocationPlaceId(placeId);
            }}
            placeholder="Search for a city or place..."
          />
        </Animated.View>

        {/* Links */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          className="mt-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-wishy-black font-semibold">
              Links (optional)
            </Text>
            <Pressable
              onPress={handleAddLink}
              disabled={isLoading}
              className="flex-row items-center"
            >
              <Ionicons name="add-circle" size={20} color="#4A1528" />
              <Text className="text-wishy-black ml-1 text-sm">Add Link</Text>
            </Pressable>
          </View>
          {links.map((link, index) => (
            <View key={index} className="flex-row items-center mb-3">
              <TextInput
                value={link}
                onChangeText={(text) => handleLinkChange(text, index)}
                placeholder="https://example.com"
                placeholderTextColor="#9A8A8A"
                className="bg-white p-4 rounded-xl text-wishy-black text-base border border-wishy-paleBlush flex-1"
                keyboardType="url"
                autoCapitalize="none"
                editable={!isLoading}
              />
              {links.length > 1 && (
                <Pressable
                  onPress={() => handleRemoveLink(index)}
                  disabled={isLoading}
                  className="ml-2 w-10 h-10 items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </Pressable>
              )}
            </View>
          ))}
        </Animated.View>

        {/* Recipients */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(400)}
          className="mt-4"
        >
          <Text className="text-wishy-black font-semibold mb-2">
            Send to (optional)
          </Text>
          <Text className="text-wishy-gray text-sm mb-2">
            Send now or select recipients later
          </Text>
          {connectedUsers.length === 0 ? (
            <View className="bg-wishy-paleBlush/30 p-4 rounded-xl">
              <Text className="text-wishy-gray text-center text-sm">
                No connected users yet. Create the wish and send after
                connecting.
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowUserPicker(true);
              }}
              disabled={isLoading}
              className="bg-white p-4 rounded-xl border border-wishy-paleBlush flex-row items-center justify-between"
            >
              {selectedUserIds.length > 0 ? (
                <>
                  <Text className="text-wishy-black font-medium">
                    {selectedUserIds.length} selected
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9A8A8A" />
                </>
              ) : (
                <>
                  <Text className="text-wishy-gray">Select recipients</Text>
                  <Ionicons name="chevron-down" size={20} color="#9A8A8A" />
                </>
              )}
            </Pressable>
          )}
        </Animated.View>

        {/* Save As Buttons */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          className="mt-6"
        >
          <Text className="text-wishy-black font-semibold mb-3">
            Save as:
          </Text>
          <View className="space-y-3">
            <Pressable
              onPress={() => isValid && handleCreate("wished")}
              disabled={!isValid || isLoading}
              className={cn(
                "p-4 rounded-xl border-2 flex-row items-center justify-between",
                isValid
                  ? "bg-pink-50 border-wishy-pink active:opacity-80"
                  : "bg-gray-100 border-gray-300"
              )}
            >
              <View className="flex-1">
                <Text
                  className={cn(
                    "font-bold text-lg",
                    isValid ? "text-wishy-black" : "text-gray-400"
                  )}
                >
                  Wished
                </Text>
                <Text
                  className={cn(
                    "text-sm mt-1",
                    isValid ? "text-wishy-gray" : "text-gray-400"
                  )}
                >
                  A desire for others to fulfill
                </Text>
              </View>
              <Ionicons
                name="heart"
                size={28}
                color={isValid ? "#FFB6D9" : "#D1D5DB"}
              />
            </Pressable>

            <Pressable
              onPress={() => isValid && handleCreate("wisher")}
              disabled={!isValid || isLoading}
              className={cn(
                "p-4 rounded-xl border-2 flex-row items-center justify-between mb-4",
                isValid
                  ? "bg-blue-50 border-blue-400 active:opacity-80"
                  : "bg-gray-100 border-gray-300"
              )}
            >
              <View className="flex-1">
                <Text
                  className={cn(
                    "font-bold text-lg",
                    isValid ? "text-wishy-black" : "text-gray-400"
                  )}
                >
                  Wisher
                </Text>
                <Text
                  className={cn(
                    "text-sm mt-1",
                    isValid ? "text-wishy-gray" : "text-gray-400"
                  )}
                >
                  An offer to fulfill for others
                </Text>
              </View>
              <Ionicons
                name="gift"
                size={28}
                color={isValid ? "#60A5FA" : "#D1D5DB"}
              />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Image Picker Modal */}
      {showImagePicker && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="absolute inset-0 bg-black/50 justify-end"
        >
          <Pressable
            className="flex-1"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowImagePicker(false);
            }}
          />
          <View
            className="bg-wishy-white rounded-t-3xl"
            style={{ paddingBottom: insets.bottom }}
          >
            <View className="p-4 border-b border-wishy-paleBlush">
              <Text className="text-wishy-black font-bold text-lg text-center">
                Add Image
              </Text>
            </View>
            <View className="p-4">
              <Pressable
                onPress={handleTakePhoto}
                disabled={isLoading}
                className="flex-row items-center p-4 bg-white rounded-xl border border-wishy-paleBlush mb-3"
              >
                <Ionicons name="camera" size={24} color="#4A1528" />
                <Text className="text-wishy-black font-semibold ml-3">
                  Take Photo
                </Text>
              </Pressable>
              <Pressable
                onPress={handlePickFromLibrary}
                disabled={isLoading}
                className="flex-row items-center p-4 bg-white rounded-xl border border-wishy-paleBlush"
              >
                <Ionicons name="images" size={24} color="#4A1528" />
                <Text className="text-wishy-black font-semibold ml-3">
                  Choose from Library
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* User Picker Modal */}
      {showUserPicker && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="absolute inset-0 bg-black/50 justify-end"
        >
          <Pressable
            className="flex-1"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowUserPicker(false);
            }}
          />
          <View
            className="bg-wishy-white rounded-t-3xl"
            style={{ paddingBottom: insets.bottom }}
          >
            <View className="p-4 border-b border-wishy-paleBlush">
              <Text className="text-wishy-black font-bold text-lg text-center">
                Select Recipients
              </Text>
              {selectedUserIds.length > 0 && (
                <Text className="text-wishy-gray text-center mt-1">
                  {selectedUserIds.length} selected
                </Text>
              )}
            </View>
            <ScrollView className="max-h-96">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedUserIds([]);
                }}
                className={cn(
                  "flex-row items-center p-4 border-b border-wishy-paleBlush",
                  selectedUserIds.length === 0 && "bg-wishy-paleBlush/30"
                )}
              >
                <View className="w-12 h-12 rounded-full bg-wishy-paleBlush items-center justify-center mr-3">
                  <Ionicons name="close-circle" size={24} color="#4A1528" />
                </View>
                <Text className="text-wishy-black font-semibold text-base flex-1">
                  No recipients
                </Text>
                {selectedUserIds.length === 0 && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#4A1528"
                  />
                )}
              </Pressable>
              {connectedUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <Pressable
                    key={user.id}
                    onPress={() => {
                      Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Medium
                      );
                      if (isSelected) {
                        setSelectedUserIds(
                          selectedUserIds.filter((id) => id !== user.id)
                        );
                      } else {
                        setSelectedUserIds([
                          ...selectedUserIds,
                          user.id,
                        ]);
                      }
                    }}
                    className={cn(
                      "flex-row items-center p-4 border-b border-wishy-paleBlush",
                      isSelected && "bg-wishy-paleBlush/30"
                    )}
                  >
                    {user.profilePhoto ? (
                      <Image
                        source={{ uri: user.profilePhoto }}
                        style={{ width: 50, height: 50 }}
                        className="rounded-full mr-3"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-wishy-paleBlush items-center justify-center mr-3">
                        <Ionicons
                          name="person"
                          size={24}
                          color="#4A1528"
                        />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-wishy-black font-semibold text-base">
                        {user.name}
                      </Text>
                      {user.bio && (
                        <Text
                          className="text-wishy-gray text-sm mt-1"
                          numberOfLines={1}
                        >
                          {user.bio}
                        </Text>
                      )}
                      <Text className="text-wishy-darkPink text-xs mt-1 capitalize">
                        {user.role}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#4A1528"
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            {selectedUserIds.length > 0 && (
              <View className="p-4 border-t border-wishy-paleBlush">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowUserPicker(false);
                  }}
                  className="bg-wishy-black py-3 rounded-xl items-center"
                >
                  <Text className="text-wishy-white font-semibold">
                    Done ({selectedUserIds.length})
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}
