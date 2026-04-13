/**
 * useCreateWishActions - Extracted handlers from CreateWishScreen
 *
 * Handles: wish creation, image picking/camera, link management
 * Keeps the screen focused on form rendering.
 */

import { useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

interface CreateWishActionsParams {
  title: string;
  description: string;
  category: string;
  customCategory: string;
  image: string | undefined;
  links: string[];
  location: string;
  selectedUserIds: string[];
  isEditMode: boolean;
  existingWish: any;
  currentUser: any;
  useCases: any;
  showToast: (msg: string, type: string) => void;
  navigation: any;
  setImage: (v: string | undefined) => void;
  setLinks: (v: string[]) => void;
  setIsLoading: (v: boolean) => void;
  setShowImagePicker: (v: boolean) => void;
  setShowCamera: (v: boolean) => void;
  cameraRef: React.RefObject<any>;
  cameraPermission: any;
  requestCameraPermission: () => Promise<any>;
}

export function useCreateWishActions(params: CreateWishActionsParams) {
  const {
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
    setImage,
    setLinks,
    setIsLoading,
    setShowImagePicker,
    setShowCamera,
    cameraRef,
    cameraPermission,
    requestCameraPermission,
  } = params;

  const handleCreate = useCallback(
    async (role: "wished" | "wisher") => {
      if (!title.trim() || !currentUser) {
        showToast("Please enter a wish title", "error");
        return;
      }

      try {
        setIsLoading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);

        const filteredLinks = links.filter((link) => link.trim().length > 0);

        if (isEditMode && existingWish) {
          showToast("Edit functionality coming in Phase 5", "info");
          setIsLoading(false);
          return;
        }

        await useCases.sendWish.execute({
          title: title.trim(),
          description: description.trim(),
          category,
          customCategory:
            category === "custom" ? customCategory.trim() : undefined,
          image,
          links: filteredLinks.length > 0 ? filteredLinks : undefined,
          location: location.trim() || undefined,
          creatorRole: role,
          targetUserIds:
            selectedUserIds.length > 0 ? selectedUserIds : undefined,
        });
      } catch (error) {
        console.error("[CreateWishScreen] Error creating wish:", error);
        showToast("Failed to create wish. Please try again.", "error");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Failure);
        setIsLoading(false);
      }
    },
    [
      title,
      currentUser,
      selectedUserIds,
      useCases.sendWish,
      isEditMode,
      existingWish,
      links,
      description,
      category,
      customCategory,
      image,
      location,
      showToast,
    ]
  );

  const handleTakePhoto = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert("Permission required", "Camera access is needed");
        return;
      }
    }
    setShowImagePicker(false);
    setShowCamera(true);
  }, [cameraPermission, requestCameraPermission, setShowImagePicker, setShowCamera]);

  const handlePickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setShowImagePicker(false);
    }
  }, [setImage, setShowImagePicker]);

  const capturePhoto = useCallback(async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      setImage(photo.uri);
      setShowCamera(false);
    }
  }, [cameraRef, setImage, setShowCamera]);

  const handleAddLink = useCallback(() => {
    setLinks([...links, ""]);
  }, [links, setLinks]);

  const handleRemoveLink = useCallback(
    (index: number) => {
      const newLinks = links.filter((_: string, i: number) => i !== index);
      setLinks(newLinks.length > 0 ? newLinks : [""]);
    },
    [links, setLinks]
  );

  const handleLinkChange = useCallback(
    (text: string, index: number) => {
      const newLinks = [...links];
      newLinks[index] = text;
      setLinks(newLinks);
    },
    [links, setLinks]
  );

  const handleRemoveImage = useCallback(() => {
    setImage(undefined);
    Haptics.selectionAsync();
  }, [setImage]);

  return {
    handleCreate,
    handleTakePhoto,
    handlePickFromLibrary,
    capturePhoto,
    handleAddLink,
    handleRemoveLink,
    handleLinkChange,
    handleRemoveImage,
  };
}
