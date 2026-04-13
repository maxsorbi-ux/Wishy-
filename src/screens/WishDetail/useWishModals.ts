/**
 * useWishModals - Custom hook for WishDetailScreen modal state management
 * 
 * Manages state for:
 * - Date modal
 * - Decline modal
 * - Delete modal
 * - Rating modal
 * - Send to modal
 * - Edit date modal
 * - Date/time pickers
 */

import { useState } from "react";

export function useWishModals() {
  // Modals
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSendToModal, setShowSendToModal] = useState(false);
  const [showEditDateModal, setShowEditDateModal] = useState(false);

  // Date proposal
  const [proposedDate, setProposedDate] = useState<Date>(new Date());
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

  // Rating
  const [rating, setRating] = useState(0);
  const [praised, setPraised] = useState(false);
  const [review, setReview] = useState("");

  // Proposal message
  const [proposalMessage, setProposalMessage] = useState("");

  // Selected users for sending
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Time strings
  const [proposedTime, setProposedTime] = useState("12:00");
  const [editTime, setEditTime] = useState("12:00");

  return {
    // Modal visibility
    modals: {
      dateModal: { show: showDateModal, setShow: setShowDateModal },
      declineModal: { show: showDeclineModal, setShow: setShowDeclineModal },
      deleteModal: { show: showDeleteModal, setShow: setShowDeleteModal },
      ratingModal: { show: showRatingModal, setShow: setShowRatingModal },
      sendToModal: { show: showSendToModal, setShow: setShowSendToModal },
      editDateModal: { show: showEditDateModal, setShow: setShowEditDateModal },
    },

    // Date proposal state
    proposal: {
      date: proposedDate,
      setDate: setProposedDate,
      time: proposedTime,
      setTime: setProposedTime,
      message: proposalMessage,
      setMessage: setProposalMessage,
      showDatePicker,
      setShowDatePicker,
      showTimePicker,
      setShowTimePicker,
    },

    // Edit date state
    editDate: {
      date: editDate,
      setDate: setEditDate,
      time: editTime,
      setTime: setEditTime,
      showDatePicker: showEditDatePicker,
      setShowDatePicker: setShowEditDatePicker,
      showTimePicker: showEditTimePicker,
      setShowTimePicker: setShowEditTimePicker,
    },

    // Rating state
    rating: {
      rating,
      setRating,
      praised,
      setPraised,
      review,
      setReview,
    },

    // Send to state
    selectedUserIds,
    setSelectedUserIds,
  };
}
