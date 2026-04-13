/**
 * WishDetailModals — All modal UI extracted from WishDetailScreen.
 *
 * Contains: Date Proposal, Decline, Delete, Rating, Date Pickers,
 * Send To User, and Edit Date modals.
 *
 * The parent screen owns modal state (via useWishDetailModals) and
 * action handlers (via useWishDetailActions). This component is pure
 * presentation — it renders modals and delegates callbacks upward.
 */

import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import DateTimePicker from "@react-native-community/datetimepicker";

import { cn } from "../../utils/cn";
import { Wish } from "../../types/wishy";
import type { WishDetailModalState } from "../hooks/useWishDetailModals";

// ────────────────────────────── Props ──────────────────────────────

interface WishDetailModalsProps {
  wish: Wish;
  isOwnWish: boolean;
  isLoadingAction: boolean;
  currentUser: { id: string } | null;
  connectedUsers: Array<{
    id: string;
    name: string;
    bio?: string;
    role?: string;
    profilePhoto?: string;
  }>;
  bottomInset: number;
  modalState: WishDetailModalState;
  onProposeDate: () => void;
  onDeclineWish: () => void;
  onDeleteWish: () => void;
  onFulfillWish: () => void;
  onUpdateDate: () => void;
  onSendToUsers: () => void;
}

// ────────────────────────────── Component ──────────────────────────────

export function WishDetailModals({
  wish,
  isOwnWish,
  isLoadingAction,
  connectedUsers,
  bottomInset,
  modalState: m,
  onProposeDate,
  onDeclineWish,
  onDeleteWish,
  onFulfillWish,
  onUpdateDate,
  onSendToUsers,
}: WishDetailModalsProps) {
  return (
    <>
      {/* ───── Date Proposal Modal ───── */}
      <Modal
        visible={m.showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => m.setShowDateModal(false)}
      >
        <Pressable
          onPress={() => m.setShowDateModal(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="bg-wishy-white rounded-t-3xl p-6"
            >
              <View className="w-12 h-1 bg-wishy-paleBlush rounded-full self-center mb-6" />

              <Text className="text-wishy-black font-bold text-xl mb-2">
                Propose a Date & Time
              </Text>
              <Text className="text-wishy-gray mb-6">
                Suggest when you would like to fulfill this wish
              </Text>

              <View className="gap-3 mb-4">
                <Pressable
                  onPress={() => m.setShowDatePicker(true)}
                  className="flex-row items-center justify-between p-4 bg-wishy-paleBlush/30 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#8B2252"
                    />
                    <Text className="text-wishy-black ml-3 font-medium">
                      {m.proposedDate.toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8B2252" />
                </Pressable>

                <Pressable
                  onPress={() => m.setShowTimePicker(true)}
                  className="flex-row items-center justify-between p-4 bg-wishy-paleBlush/30 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={20} color="#8B2252" />
                    <Text className="text-wishy-black ml-3 font-medium">
                      {m.proposedDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8B2252" />
                </Pressable>
              </View>

              <TextInput
                value={m.proposalMessage}
                onChangeText={m.setProposalMessage}
                placeholder="Add a message (optional)"
                placeholderTextColor="#9CA3AF"
                multiline
                className="bg-wishy-paleBlush/30 rounded-xl p-4 text-wishy-black mb-4 min-h-[80px]"
                style={{ textAlignVertical: "top" }}
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => m.setShowDateModal(false)}
                  className="flex-1 py-4 rounded-xl items-center border border-wishy-pink active:opacity-80"
                >
                  <Text className="text-wishy-black font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onProposeDate}
                  disabled={isLoadingAction}
                  className="flex-1 py-4 rounded-xl items-center bg-wishy-black active:opacity-90 disabled:opacity-60"
                >
                  <Text className="text-wishy-white font-semibold">
                    Confirm
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ───── Decline Modal ───── */}
      <Modal
        visible={m.showDeclineModal}
        transparent
        animationType="fade"
        onRequestClose={() => m.setShowDeclineModal(false)}
      >
        <Pressable
          onPress={() => m.setShowDeclineModal(false)}
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
                  <Ionicons name="close-circle" size={32} color="#DC2626" />
                </View>
                <Text className="text-wishy-black font-bold text-xl mb-2 text-center">
                  Decline Wish?
                </Text>
                <Text className="text-wishy-gray text-center">
                  Are you sure you want to decline this wish proposal?
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => m.setShowDeclineModal(false)}
                  className="flex-1 py-3 rounded-xl items-center border border-wishy-pink active:opacity-80"
                >
                  <Text className="text-wishy-black font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onDeclineWish}
                  disabled={isLoadingAction}
                  className="flex-1 py-3 rounded-xl items-center bg-red-500 active:opacity-90 disabled:opacity-60"
                >
                  <Text className="text-white font-semibold">Decline</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ───── Delete Modal ───── */}
      <Modal
        visible={m.showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => m.setShowDeleteModal(false)}
      >
        <Pressable
          onPress={() => m.setShowDeleteModal(false)}
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
                  <Ionicons name="trash" size={32} color="#DC2626" />
                </View>
                <Text className="text-wishy-black font-bold text-xl mb-2 text-center">
                  {isOwnWish ? "Delete Wish?" : "Remove Wish?"}
                </Text>
                <Text className="text-wishy-gray text-center">
                  {isOwnWish
                    ? "This will permanently delete the wish for everyone. This action cannot be undone."
                    : "This will remove the wish from your list. The creator will be notified."}
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => m.setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl items-center border border-wishy-pink active:opacity-80"
                >
                  <Text className="text-wishy-black font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onDeleteWish}
                  disabled={isLoadingAction}
                  className="flex-1 py-3 rounded-xl items-center bg-red-500 active:opacity-90 disabled:opacity-60"
                >
                  <Text className="text-white font-semibold">
                    {isOwnWish ? "Delete" : "Remove"}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ───── Rating Modal ───── */}
      <Modal
        visible={m.showRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => m.setShowRatingModal(false)}
      >
        <Pressable
          onPress={() => m.setShowRatingModal(false)}
          className="flex-1 bg-black/50 justify-center items-center"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="bg-wishy-white rounded-3xl p-6 mx-6 w-[90%] max-w-md"
            >
              <View className="items-center mb-6">
                <View className="w-20 h-20 bg-wishy-pink rounded-full items-center justify-center mb-4">
                  <Ionicons name="sparkles" size={40} color="#8B2252" />
                </View>
                <Text className="text-wishy-black font-bold text-2xl mb-2 text-center">
                  {wish.status === "fulfilled"
                    ? "Edit Rating"
                    : "Rate This Wish"}
                </Text>
                <Text className="text-wishy-gray text-center text-sm">
                  How satisfied are you with this experience?
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-wishy-black font-semibold mb-3 text-center">
                  Magic Wands
                </Text>
                <View className="flex-row justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((wand) => (
                    <Pressable
                      key={wand}
                      onPress={() => {
                        Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light
                        );
                        m.setRating(wand);
                      }}
                      className="items-center"
                    >
                      <Ionicons
                        name={
                          m.rating >= wand ? "sparkles" : "sparkles-outline"
                        }
                        size={36}
                        color={
                          m.rating >= wand ? "#8B2252" : "#9A8A8A"
                        }
                      />
                    </Pressable>
                  ))}
                </View>
                <Text className="text-center text-wishy-gray text-sm mt-2">
                  {m.rating === 0 && "Tap to rate"}
                  {m.rating === 1 && "Poor"}
                  {m.rating === 2 && "Fair"}
                  {m.rating === 3 && "Good"}
                  {m.rating === 4 && "Very Good"}
                  {m.rating === 5 && "Excellent!"}
                </Text>
              </View>

              <View className="mb-6">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    m.setPraised(!m.praised);
                  }}
                  className={cn(
                    "flex-row items-center justify-center p-4 rounded-2xl border-2",
                    m.praised
                      ? "bg-wishy-paleBlush border-wishy-pink"
                      : "bg-gray-50 border-gray-300"
                  )}
                >
                  <Ionicons
                    name={m.praised ? "heart" : "heart-outline"}
                    size={28}
                    color={m.praised ? "#D4536B" : "#9A8A8A"}
                  />
                  <Text
                    className={cn(
                      "ml-3 font-semibold text-base",
                      m.praised ? "text-wishy-darkPink" : "text-wishy-gray"
                    )}
                  >
                    {m.praised ? "With Love ❤️" : "Add a Heart"}
                  </Text>
                </Pressable>
              </View>

              <View className="mb-6">
                <Text className="text-wishy-black font-semibold mb-2">
                  Review (optional)
                </Text>
                <TextInput
                  value={m.review}
                  onChangeText={m.setReview}
                  placeholder="Share your thoughts about this experience..."
                  placeholderTextColor="#9A8A8A"
                  multiline
                  numberOfLines={4}
                  className="bg-wishy-paleBlush/30 p-4 rounded-xl text-wishy-black text-base min-h-[100px]"
                  style={{ textAlignVertical: "top" }}
                />
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    m.setShowRatingModal(false);
                    m.setRating(0);
                    m.setPraised(false);
                    m.setReview("");
                  }}
                  className="flex-1 py-3 rounded-xl items-center border-2 border-wishy-paleBlush active:opacity-80"
                >
                  <Text className="text-wishy-black font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onFulfillWish}
                  disabled={m.rating === 0 || isLoadingAction}
                  className={cn(
                    "flex-1 py-3 rounded-xl items-center active:opacity-90",
                    m.rating === 0 || isLoadingAction
                      ? "bg-gray-300"
                      : "bg-wishy-black"
                  )}
                >
                  <Text
                    className={cn(
                      "font-semibold",
                      m.rating === 0 || isLoadingAction
                        ? "text-gray-500"
                        : "text-wishy-white"
                    )}
                  >
                    Confirm
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ───── Date Picker ───── */}
      {m.showDatePicker && (
        <DateTimePicker
          value={m.proposedDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            m.setShowDatePicker(false);
            if (selectedDate && event.type === "set") {
              const newDate = new Date(selectedDate);
              newDate.setHours(m.proposedDate.getHours());
              newDate.setMinutes(m.proposedDate.getMinutes());
              m.setProposedDate(newDate);
            }
          }}
        />
      )}

      {/* ───── Time Picker ───── */}
      {m.showTimePicker && (
        <DateTimePicker
          value={m.proposedDate}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            m.setShowTimePicker(false);
            if (selectedTime && event.type === "set") {
              const newDate = new Date(m.proposedDate);
              newDate.setHours(selectedTime.getHours());
              newDate.setMinutes(selectedTime.getMinutes());
              m.setProposedDate(newDate);
            }
          }}
        />
      )}

      {/* ───── Send To User Modal ───── */}
      <Modal
        visible={m.showSendToModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          m.setShowSendToModal(false);
          m.setSelectedUserIds([]);
        }}
      >
        <Pressable
          onPress={() => {
            m.setShowSendToModal(false);
            m.setSelectedUserIds([]);
          }}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="bg-wishy-white rounded-t-3xl"
              style={{ paddingBottom: bottomInset }}
            >
              <View className="p-4 border-b border-wishy-paleBlush">
                <View className="w-12 h-1 bg-wishy-paleBlush rounded-full self-center mb-4" />
                <Text className="text-wishy-black font-bold text-xl text-center">
                  {wish.creatorRole === "wisher"
                    ? "Send Offer To"
                    : "Send Request To"}
                </Text>
                <Text className="text-wishy-gray text-center mt-1">
                  {wish.creatorRole === "wisher"
                    ? "Choose who you want to fulfill this wish for"
                    : "Choose who you want to fulfill this wish"}
                </Text>
                {m.selectedUserIds.length > 0 && (
                  <Text className="text-wishy-darkPink text-center mt-2 font-semibold">
                    {m.selectedUserIds.length} selected
                  </Text>
                )}
              </View>
              {connectedUsers.length === 0 ? (
                <View className="p-6 items-center">
                  <View className="w-16 h-16 bg-wishy-paleBlush rounded-full items-center justify-center mb-3">
                    <Ionicons
                      name="people-outline"
                      size={32}
                      color="#8B2252"
                    />
                  </View>
                  <Text className="text-wishy-black font-semibold text-lg mb-2">
                    No Connected Users
                  </Text>
                  <Text className="text-wishy-gray text-center mb-4">
                    Connect with others first to send them wishes
                  </Text>
                  <Pressable
                    onPress={() => m.setShowSendToModal(false)}
                    className="bg-wishy-black px-6 py-3 rounded-xl"
                  >
                    <Text className="text-wishy-white font-semibold">
                      Close
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <ScrollView className="max-h-96">
                    {connectedUsers.map((user) => {
                      const isSelected = m.selectedUserIds.includes(user.id);
                      return (
                        <Pressable
                          key={user.id}
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Medium
                            );
                            if (isSelected) {
                              m.setSelectedUserIds(
                                m.selectedUserIds.filter((id) => id !== user.id)
                              );
                            } else {
                              m.setSelectedUserIds([
                                ...m.selectedUserIds,
                                user.id,
                              ]);
                            }
                          }}
                          className={cn(
                            "flex-row items-center p-4 border-b border-wishy-paleBlush active:bg-wishy-paleBlush/30",
                            isSelected && "bg-wishy-paleBlush/30"
                          )}
                        >
                          {user.profilePhoto ? (
                            <Image
                              source={{ uri: user.profilePhoto }}
                              style={{ width: 56, height: 56 }}
                              className="rounded-full mr-4"
                            />
                          ) : (
                            <View className="w-14 h-14 rounded-full bg-wishy-paleBlush items-center justify-center mr-4">
                              <Ionicons
                                name="person"
                                size={28}
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
                                numberOfLines={2}
                              >
                                {user.bio}
                              </Text>
                            )}
                            <Text className="text-wishy-darkPink text-xs mt-1 capitalize">
                              {user.role}
                            </Text>
                          </View>
                          {isSelected ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color="#4A1528"
                            />
                          ) : (
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color="#9A8A8A"
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  {m.selectedUserIds.length > 0 && (
                    <View className="p-4 border-t border-wishy-paleBlush">
                      <Pressable
                        onPress={onSendToUsers}
                        disabled={isLoadingAction}
                        className="bg-wishy-black py-4 rounded-xl items-center disabled:opacity-60"
                      >
                        <Text className="text-wishy-white font-semibold text-base">
                          Send to {m.selectedUserIds.length}{" "}
                          {m.selectedUserIds.length === 1 ? "user" : "users"}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ───── Edit Date Modal ───── */}
      <Modal
        visible={m.showEditDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => m.setShowEditDateModal(false)}
      >
        <Pressable
          onPress={() => m.setShowEditDateModal(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="bg-wishy-white rounded-t-3xl p-6"
            >
              <View className="w-12 h-1 bg-wishy-paleBlush rounded-full self-center mb-6" />

              <Text className="text-wishy-black font-bold text-xl mb-2">
                Edit Date & Time
              </Text>
              <Text className="text-wishy-gray mb-6">
                Change the date and time for this wish. The other person will
                be notified.
              </Text>

              <View className="gap-3 mb-4">
                <Pressable
                  onPress={() => {
                    m.setShowEditDatePicker(!m.showEditDatePicker);
                    m.setShowEditTimePicker(false);
                  }}
                  className="flex-row items-center justify-between p-4 bg-wishy-paleBlush/30 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#8B2252"
                    />
                    <Text className="text-wishy-black ml-3 font-medium">
                      {m.editDate.toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      m.showEditDatePicker ? "chevron-down" : "chevron-forward"
                    }
                    size={20}
                    color="#8B2252"
                  />
                </Pressable>

                {m.showEditDatePicker && (
                  <View className="bg-white rounded-xl overflow-hidden">
                    <DateTimePicker
                      value={m.editDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          const newDate = new Date(selectedDate);
                          newDate.setHours(m.editDate.getHours());
                          newDate.setMinutes(m.editDate.getMinutes());
                          m.setEditDate(newDate);
                        }
                      }}
                    />
                  </View>
                )}

                <Pressable
                  onPress={() => {
                    m.setShowEditTimePicker(!m.showEditTimePicker);
                    m.setShowEditDatePicker(false);
                  }}
                  className="flex-row items-center justify-between p-4 bg-wishy-paleBlush/30 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={20} color="#8B2252" />
                    <Text className="text-wishy-black ml-3 font-medium">
                      {m.editDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      m.showEditTimePicker ? "chevron-down" : "chevron-forward"
                    }
                    size={20}
                    color="#8B2252"
                  />
                </Pressable>

                {m.showEditTimePicker && (
                  <View className="bg-white rounded-xl overflow-hidden">
                    <DateTimePicker
                      value={m.editDate}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedTime) => {
                        if (selectedTime) {
                          const newDate = new Date(m.editDate);
                          newDate.setHours(selectedTime.getHours());
                          newDate.setMinutes(selectedTime.getMinutes());
                          m.setEditDate(newDate);
                        }
                      }}
                    />
                  </View>
                )}
              </View>

              <TextInput
                value={m.proposalMessage}
                onChangeText={m.setProposalMessage}
                placeholder="Add a message about the change (optional)"
                placeholderTextColor="#9CA3AF"
                multiline
                className="bg-wishy-paleBlush/30 rounded-xl p-4 text-wishy-black mb-4 min-h-[80px]"
                style={{ textAlignVertical: "top" }}
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => m.setShowEditDateModal(false)}
                  className="flex-1 py-4 rounded-xl items-center border border-wishy-pink active:opacity-80"
                >
                  <Text className="text-wishy-black font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onUpdateDate}
                  disabled={isLoadingAction}
                  className="flex-1 py-4 rounded-xl items-center bg-wishy-black active:opacity-90 disabled:opacity-60"
                >
                  <Text className="text-wishy-white font-semibold">Update</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
