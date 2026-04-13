/**
 * useProfileActions - Extracted handlers from ProfileScreen
 *
 * Handles: photo management, role changes, logout, delete account, navigation
 * Keeps the screen focused on rendering profile data.
 */

import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { UserRole } from "../../types/wishy";

interface ProfileActionsParams {
  currentUser: any;
  updateUser: (data: any) => void;
  logout: () => Promise<void>;
  deleteAccount: () => void;
  navigation: any;
  setShowPhotoModal: (v: boolean) => void;
  setShowEnlargedPhoto: (v: boolean) => void;
  setShowRoleModal: (v: boolean) => void;
  setShowDeleteModal: (v: boolean) => void;
  setShowLogoutModal: (v: boolean) => void;
}

export function useProfileActions(params: ProfileActionsParams) {
  const {
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
  } = params;

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogoutModal(true);
  }, [setShowLogoutModal]);

  const confirmLogout = useCallback(async () => {
    await logout();
    setShowLogoutModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  }, [logout, navigation, setShowLogoutModal]);

  const handleQRCode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("QRCode");
  }, [navigation]);

  const handleChangePhoto = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPhotoModal(true);
  }, [setShowPhotoModal]);

  const handleViewPhoto = useCallback(() => {
    if (currentUser?.profilePhoto) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowEnlargedPhoto(true);
    }
  }, [currentUser?.profilePhoto, setShowEnlargedPhoto]);

  const handleTakePhoto = useCallback(async () => {
    setShowPhotoModal(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateUser({ profilePhoto: result.assets[0].uri });
    }
  }, [setShowPhotoModal, updateUser]);

  const handleChoosePhoto = useCallback(async () => {
    setShowPhotoModal(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateUser({ profilePhoto: result.assets[0].uri });
    }
  }, [setShowPhotoModal, updateUser]);

  const handleRemovePhoto = useCallback(() => {
    setShowPhotoModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateUser({ profilePhoto: undefined });
  }, [setShowPhotoModal, updateUser]);

  const handleLogoPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Landing");
  }, [navigation]);

  const handleChangeRole = useCallback(
    (newRole: UserRole) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateUser({ role: newRole });
      setShowRoleModal(false);
    },
    [updateUser, setShowRoleModal]
  );

  const handleEditProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("EditProfile");
  }, [navigation]);

  const handleSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Settings");
  }, [navigation]);

  const handleDeleteAccount = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDeleteModal(true);
  }, [setShowDeleteModal]);

  const confirmDeleteAccount = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deleteAccount();
    setShowDeleteModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  }, [deleteAccount, navigation, setShowDeleteModal]);

  return {
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
  };
}
