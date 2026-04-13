/**
 * ProfileModals — All modal UI extracted from ProfileScreen.
 *
 * Contains: Photo Options, Enlarged Photo, Change Role,
 * Delete Account, and Logout modals.
 */

import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Image } from "expo-image";

import { cn } from "../../utils/cn";
import { UserRole } from "../../types/wishy";

// ────────────────────────────── Props ──────────────────────────────

interface ProfileModalsProps {
  currentUser: {
    profilePhoto?: string;
    role?: string;
  } | null;
  // Photo modal
  showPhotoModal: boolean;
  setShowPhotoModal: (v: boolean) => void;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
  onRemovePhoto: () => void;
  // Enlarged photo modal
  showEnlargedPhoto: boolean;
  setShowEnlargedPhoto: (v: boolean) => void;
  // Role modal
  showRoleModal: boolean;
  setShowRoleModal: (v: boolean) => void;
  onChangeRole: (role: UserRole) => void;
  // Delete account modal
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  onConfirmDelete: () => void;
  // Logout modal
  showLogoutModal: boolean;
  setShowLogoutModal: (v: boolean) => void;
  onConfirmLogout: () => void;
}

// ────────────────────────────── Component ──────────────────────────────

export function ProfileModals({
  currentUser,
  showPhotoModal,
  setShowPhotoModal,
  onTakePhoto,
  onChoosePhoto,
  onRemovePhoto,
  showEnlargedPhoto,
  setShowEnlargedPhoto,
  showRoleModal,
  setShowRoleModal,
  onChangeRole,
  showDeleteModal,
  setShowDeleteModal,
  onConfirmDelete,
  showLogoutModal,
  setShowLogoutModal,
  onConfirmLogout,
}: ProfileModalsProps) {
  return (
    <>
      {/* ───── Photo Options Modal ───── */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <Pressable
          onPress={() => setShowPhotoModal(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="bg-wishy-white rounded-t-3xl p-6"
            >
              <View className="w-12 h-1 bg-wishy-paleBlush rounded-full self-center mb-6" />

              <Text className="text-wishy-black font-bold text-xl mb-6 text-center">
                Profile Photo
              </Text>

              <Pressable
                onPress={onTakePhoto}
                className="bg-wishy-pink/20 rounded-xl p-4 flex-row items-center mb-3 active:opacity-80"
              >
                <View className="w-10 h-10 bg-wishy-pink rounded-xl items-center justify-center">
                  <Ionicons name="camera" size={22} color="#000000" />
                </View>
                <Text className="flex-1 text-wishy-black font-medium ml-3">
                  Take Photo
                </Text>
              </Pressable>

              <Pressable
                onPress={onChoosePhoto}
                className="bg-wishy-pink/20 rounded-xl p-4 flex-row items-center mb-3 active:opacity-80"
              >
                <View className="w-10 h-10 bg-wishy-pink rounded-xl items-center justify-center">
                  <Ionicons name="images" size={22} color="#000000" />
                </View>
                <Text className="flex-1 text-wishy-black font-medium ml-3">
                  Choose from Library
                </Text>
              </Pressable>

              {currentUser?.profilePhoto && (
                <Pressable
                  onPress={onRemovePhoto}
                  className="bg-red-50 rounded-xl p-4 flex-row items-center mb-3 active:opacity-80"
                >
                  <View className="w-10 h-10 bg-red-100 rounded-xl items-center justify-center">
                    <Ionicons name="trash-outline" size={22} color="#DC2626" />
                  </View>
                  <Text className="flex-1 text-red-600 font-medium ml-3">
                    Remove Photo
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => setShowPhotoModal(false)}
                className="mt-2 py-4 rounded-xl items-center active:opacity-80"
              >
                <Text className="text-wishy-gray font-medium">Cancel</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ───── Enlarged Photo Modal ───── */}
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
            {currentUser?.profilePhoto && (
              <Image
                source={{ uri: currentUser.profilePhoto }}
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

      {/* ───── Change Role Modal ───── */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <Pressable
          onPress={() => setShowRoleModal(false)}
          className="flex-1 bg-black/50 justify-center items-center"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="bg-wishy-white rounded-3xl p-6 mx-6 w-[90%] max-w-md"
            >
              <View className="items-center mb-6">
                <View className="w-16 h-16 bg-wishy-paleBlush rounded-full items-center justify-center mb-4">
                  <Ionicons name="person" size={32} color="#8B2252" />
                </View>
                <Text className="text-wishy-black font-bold text-2xl mb-2 text-center">
                  Change Your Role
                </Text>
                <Text className="text-wishy-gray text-center text-sm">
                  Select the role that best describes how you want to use Wishy
                </Text>
              </View>

              {/* Role Options */}
              <View className="gap-3 mb-4">
                {/* Wished */}
                <Pressable
                  onPress={() => onChangeRole("wished")}
                  className={cn(
                    "p-4 rounded-2xl border-2 active:opacity-80",
                    currentUser?.role === "wished"
                      ? "bg-wishy-paleBlush border-wishy-darkPink"
                      : "bg-white border-wishy-paleBlush"
                  )}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-wishy-black font-bold text-lg">Wished</Text>
                    {currentUser?.role === "wished" && (
                      <Ionicons name="checkmark-circle" size={24} color="#8B2252" />
                    )}
                  </View>
                  <Text className="text-wishy-gray text-sm">
                    Share your desires and let others fulfill them
                  </Text>
                </Pressable>

                {/* Wisher */}
                <Pressable
                  onPress={() => onChangeRole("wisher")}
                  className={cn(
                    "p-4 rounded-2xl border-2 active:opacity-80",
                    currentUser?.role === "wisher"
                      ? "bg-wishy-paleBlush border-wishy-darkPink"
                      : "bg-white border-wishy-paleBlush"
                  )}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-wishy-black font-bold text-lg">Wisher</Text>
                    {currentUser?.role === "wisher" && (
                      <Ionicons name="checkmark-circle" size={24} color="#8B2252" />
                    )}
                  </View>
                  <Text className="text-wishy-gray text-sm">
                    Discover wishes to fulfill and create meaningful moments
                  </Text>
                </Pressable>

                {/* Both */}
                <Pressable
                  onPress={() => onChangeRole("both")}
                  className={cn(
                    "p-4 rounded-2xl border-2 active:opacity-80",
                    currentUser?.role === "both"
                      ? "bg-wishy-paleBlush border-wishy-darkPink"
                      : "bg-white border-wishy-paleBlush"
                  )}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-wishy-black font-bold text-lg">Wisher & Wished</Text>
                    {currentUser?.role === "both" && (
                      <Ionicons name="checkmark-circle" size={24} color="#8B2252" />
                    )}
                  </View>
                  <Text className="text-wishy-gray text-sm">
                    Experience the full Wishy journey - share and fulfill wishes
                  </Text>
                </Pressable>
              </View>

              {/* Cancel Button */}
              <Pressable
                onPress={() => setShowRoleModal(false)}
                className="py-3 rounded-xl items-center border-2 border-wishy-paleBlush active:opacity-80"
              >
                <Text className="text-wishy-black font-semibold">Cancel</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ───── Delete Account Confirmation Modal ───── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          onPress={() => setShowDeleteModal(false)}
          className="flex-1 bg-black/50 justify-center items-center"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="bg-wishy-white rounded-3xl p-6 mx-6 w-80"
            >
              <View className="items-center mb-4">
                <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="warning" size={32} color="#DC2626" />
                </View>
                <Text className="text-wishy-black font-bold text-xl mb-2 text-center">
                  Delete Account?
                </Text>
                <Text className="text-wishy-gray text-center text-sm">
                  This action cannot be undone. All your wishes, connections, and data will be permanently deleted.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl items-center border border-wishy-pink active:opacity-80"
                >
                  <Text className="text-wishy-black font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onConfirmDelete}
                  className="flex-1 py-3 rounded-xl items-center bg-red-600 active:opacity-90"
                >
                  <Text className="text-white font-semibold">Delete</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ───── Logout Confirmation Modal ───── */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          onPress={() => setShowLogoutModal(false)}
          className="flex-1 bg-black/50 justify-center items-center"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="bg-wishy-white rounded-3xl p-6 mx-6 w-80"
            >
              <View className="items-center mb-4">
                <View className="w-16 h-16 bg-wishy-paleBlush rounded-full items-center justify-center mb-3">
                  <Ionicons name="log-out-outline" size={32} color="#8B2252" />
                </View>
                <Text className="text-wishy-black font-bold text-xl mb-2 text-center">
                  Log Out?
                </Text>
                <Text className="text-wishy-gray text-center text-sm">
                  You will be redirected to the welcome screen and can log in with a different account.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 rounded-xl items-center border border-wishy-pink active:opacity-80"
                >
                  <Text className="text-wishy-black font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onConfirmLogout}
                  className="flex-1 py-3 rounded-xl items-center bg-wishy-pink active:opacity-90"
                >
                  <Text className="text-wishy-black font-semibold">Log Out</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
