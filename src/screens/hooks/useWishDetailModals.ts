/**
 * useWishDetailModals - Modal state management for WishDetailScreen
 * 
 * Handles all modal open/close state and related form data
 * Keeps modals and their state isolated from the main screen.
 */

import { useState } from "react";

export type WishDetailModalState = ReturnType<typeof useWishDetailModals>;

export function useWishDetailModals() {
  // Modal visibility
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSendToModal, setShowSendToModal] = useState(false);
  const [showEditDateModal, setShowEditDateModal] = useState(false);

  // Form Data
  const [proposedDate, setProposedDate] = useState<Date>(new Date());
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [proposalMessage, setProposalMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [praised, setPraised] = useState(false);
  const [review, setReview] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Date/Time Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

  return {
    // Modal visibility
    showDateModal,
    setShowDateModal,
    showDeclineModal,
    setShowDeclineModal,
    showDeleteModal,
    setShowDeleteModal,
    showRatingModal,
    setShowRatingModal,
    showSendToModal,
    setShowSendToModal,
    showEditDateModal,
    setShowEditDateModal,
    // Form data
    proposedDate,
    setProposedDate,
    editDate,
    setEditDate,
    proposalMessage,
    setProposalMessage,
    rating,
    setRating,
    praised,
    setPraised,
    review,
    setReview,
    selectedUserIds,
    setSelectedUserIds,
    // Picker visibility
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    showEditDatePicker,
    setShowEditDatePicker,
    showEditTimePicker,
    setShowEditTimePicker,
  };
}
