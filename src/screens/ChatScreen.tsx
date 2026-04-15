import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

// Phase 4: Use new hooks instead of stores
import { useRepositories, useEventListeners } from "../hooks/useDI";
import useUserStore from "../state/userStore";
import { enrichSingleWish } from "../utils/enrichWishWithRecipients";
import { useToastStore } from "../state/toastStore";
import { ChatMessage } from "../types/wishy";
import { cn } from "../utils/cn";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Chat">;
type ChatRouteProp = RouteProp<RootStackParamList, "Chat">;

/**
 * ChatScreen - Phase 4 Refactored Version
 *
 * Real-time messaging for wish coordination:
 * - useRepositories() for loading wish, chat, and messages
 * - useEventListeners() for real-time message updates (replaces polling)
 * - Local state for message input and UI
 */
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { wishId, chatId } = route.params;

  const flatListRef = useRef<FlatList>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Phase 4: Use hooks
  const repos = useRepositories()();
  const currentUser = useUserStore((s) => s.currentUser);
  const allUsers = useUserStore((s) => s.allUsers);
  const showToast = useToastStore((s) => s.showToast);

  // Data state
  const [wish, setWish] = useState<any>(null);
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wish data
  const loadWishAndChat = useCallback(async () => {
    if (!wishId || !currentUser) return;
    try {
      setLoading(true);
      let wishData: any = await repos.wishRepository.findById(wishId);
      
      if (wishData) {
        // Enrich wish with recipient data
        wishData = await enrichSingleWish(wishData, repos.wishRecipientRepository);
      }
      
      setWish(wishData);

      // Load or create chat
      let chatData = await repos.chatRepository.findByWishId(wishId);
      if (!chatData && wishData) {
        // Build participants list
        const participants: string[] = [currentUser.id];
        if (wishData.creatorId !== currentUser.id) {
          participants.push(wishData.creatorId);
        }
        if (wishData.targetUserIds?.length) {
          wishData.targetUserIds.forEach((id: string) => {
            if (id !== currentUser.id && !participants.includes(id)) {
              participants.push(id);
            }
          });
        }
        if (wishData.targetUserId && wishData.targetUserId !== currentUser.id && !participants.includes(wishData.targetUserId)) {
          participants.push(wishData.targetUserId);
        }

        if (participants.length >= 2) {
          chatData = await repos.chatRepository.create(wishId, participants);
        }
      }

      if (chatData) {
        setChat(chatData);
        // Load messages
        const msgs = await repos.chatRepository.getMessages(chatData.id);
        setMessages(msgs);
      }
    } catch (error) {
      console.error("[ChatScreen] Error loading wish and chat:", error);
    } finally {
      setLoading(false);
    }
  }, [wishId, currentUser, repos.wishRepository, repos.wishRecipientRepository, repos.chatRepository]);

  // Load on mount
  useEffect(() => {
    loadWishAndChat();
  }, [wishId, currentUser, loadWishAndChat]);

  // Set navigation title
  useEffect(() => {
    if (wish) {
      navigation.setOptions({
        headerTitle: wish.title,
      });
    }
  }, [wish, navigation]);

  // Subscribe to new messages via events (replaces polling)
  useEventListeners({
    "message.sent": () => {
      console.log("[ChatScreen] New message sent event");
      if (chat?.id) {
        repos.chatRepository.getMessages(chat.id).then(setMessages);
      }
    },
    "message.received": () => {
      console.log("[ChatScreen] New message received event");
      if (chat?.id) {
        repos.chatRepository.getMessages(chat.id).then(setMessages);
      }
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!message.trim() || !currentUser || !chat || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);

    const messageText = message.trim();
    setMessage("");

    try {
      // Use repository to send message and emit event
      const chatUseCases = require("../hooks/useDI").useChatUseCases()();
      await chatUseCases.sendMessage(chat.id, currentUser.id, messageText);
      
      // Reload messages
      const msgs = await repos.chatRepository.getMessages(chat.id);
      setMessages(msgs);
    } catch (error) {
      console.log("Error sending message:", error);
      setMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === currentUser?.id;

    return (
      <View
        className={cn(
          "max-w-[80%] mb-3",
          isOwnMessage ? "self-end" : "self-start"
        )}
      >
        <View
          className={cn(
            "px-4 py-3 rounded-2xl",
            isOwnMessage
              ? "bg-wishy-black rounded-br-sm"
              : "bg-white rounded-bl-sm"
          )}
        >
          <Text
            className={cn(
              "text-base",
              isOwnMessage ? "text-wishy-white" : "text-wishy-black"
            )}
          >
            {item.text}
          </Text>
        </View>
        <Text
          className={cn(
            "text-xs mt-1 text-wishy-gray",
            isOwnMessage ? "text-right" : "text-left"
          )}
        >
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-wishy-white items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
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
    <KeyboardAvoidingView
      className="flex-1 bg-wishy-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Wish Header */}
      <View className="bg-white border-b border-wishy-paleBlush px-4 py-3 flex-row items-center">
        {wish.image && (
          <Image
            source={{ uri: wish.image }}
            style={{ width: 48, height: 48, borderRadius: 8 }}
            contentFit="cover"
          />
        )}
        <View className="flex-1 ml-3">
          <Text className="text-wishy-black font-semibold" numberOfLines={1}>
            {wish.title}
          </Text>
          <Text className="text-wishy-gray text-sm" numberOfLines={1}>
            {wish.description}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1,
          justifyContent: messages.length ? "flex-end" : "center",
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-8">
            <View className="w-16 h-16 bg-wishy-paleBlush rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={32} color="#8B2252" />
            </View>
            <Text className="text-wishy-black font-semibold text-base">
              Start the conversation
            </Text>
            <Text className="text-wishy-gray text-center mt-2 px-8">
              Send a message to discuss this wish
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View
        className="bg-white border-t border-wishy-paleBlush px-4 py-3 flex-row items-end"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="#9A8A8A"
          multiline
          editable={!isSending}
          className="flex-1 bg-wishy-white rounded-2xl px-4 py-3 text-wishy-black text-base max-h-32"
        />
        <Pressable
          onPress={handleSend}
          disabled={!message.trim() || isSending}
          className={cn(
            "w-11 h-11 rounded-full items-center justify-center ml-2",
            isSending ? "bg-wishy-black" : message.trim() ? "bg-wishy-black" : "bg-wishy-gray/30"
          )}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFF8F0" />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={message.trim() ? "#FFF8F0" : "#9A8A8A"}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
