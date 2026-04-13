/**
 * Domain events represent important business occurrences
 * These drive notifications, side effects, and state synchronization
 */

export interface DomainEvent {
  type: string;
  aggregateId: string;
  aggregateType: "wish" | "connection" | "review" | "user";
  occurredAt: string; // ISO 8601
  metadata?: Record<string, unknown>;
}

// Wish Events
export interface WishCreatedEvent extends DomainEvent {
  type: "wish.created";
  aggregateType: "wish";
  data: {
    wishId: string;
    creatorId: string;
    creatorRole: "wisher" | "wished" | "both";
    title: string;
    status: "draft";
  };
}

export interface WishSentEvent extends DomainEvent {
  type: "wish.sent";
  aggregateType: "wish";
  data: {
    wishId: string;
    creatorId: string;
    recipientIds: string[];
    title: string;
  };
}

export interface WishAcceptedEvent extends DomainEvent {
  type: "wish.accepted";
  aggregateType: "wish";
  data: {
    wishId: string;
    recipientId: string;
    creatorId: string;
    title: string;
  };
}

export interface WishRejectedEvent extends DomainEvent {
  type: "wish.rejected";
  aggregateType: "wish";
  data: {
    wishId: string;
    recipientId: string;
    creatorId: string;
    title: string;
  };
}

export interface WishDateProposedEvent extends DomainEvent {
  type: "wish.dateProposed";
  aggregateType: "wish";
  data: {
    wishId: string;
    proposedBy: string;
    proposedDate: string;
    proposedTime: string;
    title: string;
  };
}

export interface WishDateConfirmedEvent extends DomainEvent {
  type: "wish.dateConfirmed";
  aggregateType: "wish";
  data: {
    wishId: string;
    confirmedBy: string;
    confirmedDate: string;
    title: string;
  };
}

export interface WishFulfilledEvent extends DomainEvent {
  type: "wish.fulfilled";
  aggregateType: "wish";
  data: {
    wishId: string;
    ratedBy: string;
    rating: number; // 0-5
    praised: boolean;
    review?: string;
    title: string;
  };
}

export interface WishDeletedEvent extends DomainEvent {
  type: "wish.deleted";
  aggregateType: "wish";
  data: {
    wishId: string;
    deletedBy: string;
    deletedFor: "creator" | "recipient" | "all";
    title: string;
  };
}

// Connection Events
export interface ConnectionRequestSentEvent extends DomainEvent {
  type: "connection.requestSent";
  aggregateType: "connection";
  data: {
    requestId: string;
    senderId: string;
    receiverId: string;
    message?: string;
  };
}

export interface ConnectionRequestAcceptedEvent extends DomainEvent {
  type: "connection.requestAccepted";
  aggregateType: "connection";
  data: {
    requestId: string;
    connectionId: string;
    senderId: string;
    receiverId: string;
    connectionType: "friend" | "relationship";
  };
}

export interface ConnectionRequestRejectedEvent extends DomainEvent {
  type: "connection.requestRejected";
  aggregateType: "connection";
  data: {
    requestId: string;
    senderId: string;
    receiverId: string;
  };
}

export interface RelationshipUpgradeRequestedEvent extends DomainEvent {
  type: "connection.relationshipUpgradeRequested";
  aggregateType: "connection";
  data: {
    connectionId: string;
    requestedBy: string;
    otherUserId: string;
  };
}

export interface RelationshipUpgradeConfirmedEvent extends DomainEvent {
  type: "connection.relationshipUpgradeConfirmed";
  aggregateType: "connection";
  data: {
    connectionId: string;
    confirmedBy: string;
    otherUserId: string;
  };
}

export interface UserBlockedEvent extends DomainEvent {
  type: "connection.userBlocked";
  aggregateType: "connection";
  data: {
    blockerId: string;
    blockedUserId: string;
  };
}

// Review Events
export interface ReviewSubmittedEvent extends DomainEvent {
  type: "review.submitted";
  aggregateType: "review";
  data: {
    wishId: string;
    ratedBy: string;
    rating: number;
    praised: boolean;
    review?: string;
  };
}

export type AllDomainEvents =
  | WishCreatedEvent
  | WishSentEvent
  | WishAcceptedEvent
  | WishRejectedEvent
  | WishDateProposedEvent
  | WishDateConfirmedEvent
  | WishFulfilledEvent
  | WishDeletedEvent
  | ConnectionRequestSentEvent
  | ConnectionRequestAcceptedEvent
  | ConnectionRequestRejectedEvent
  | RelationshipUpgradeRequestedEvent
  | RelationshipUpgradeConfirmedEvent
  | UserBlockedEvent
  | ReviewSubmittedEvent;
