/**
 * Domain-level errors
 * These represent violations of business rules, not system failures
 */

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class WishNotFoundError extends DomainError {
  constructor(wishId: string) {
    super("WISH_NOT_FOUND", `Wish with ID ${wishId} not found`, { wishId });
  }
}

export class InvalidWishTransitionError extends DomainError {
  constructor(currentStatus: string, attemptedStatus: string) {
    super(
      "INVALID_WISH_TRANSITION",
      `Cannot transition wish from "${currentStatus}" to "${attemptedStatus}"`,
      { currentStatus, attemptedStatus }
    );
  }
}

export class UserNotAuthorizedError extends DomainError {
  constructor(userId: string, action: string) {
    super(
      "USER_NOT_AUTHORIZED",
      `User ${userId} is not authorized to ${action}`,
      { userId, action }
    );
  }
}

export class ConnectionNotFoundError extends DomainError {
  constructor(connectionId: string) {
    super("CONNECTION_NOT_FOUND", `Connection with ID ${connectionId} not found`, { connectionId });
  }
}

export class InvalidConnectionStateError extends DomainError {
  constructor(connectionId: string, state: string) {
    super(
      "INVALID_CONNECTION_STATE",
      `Connection ${connectionId} is in invalid state: ${state}`,
      { connectionId, state }
    );
  }
}

export class WishRecipientNotFoundError extends DomainError {
  constructor(wishId: string, recipientId: string) {
    super(
      "WISH_RECIPIENT_NOT_FOUND",
      `Recipient ${recipientId} not found for wish ${wishId}`,
      { wishId, recipientId }
    );
  }
}

export class InvalidDateProposalError extends DomainError {
  constructor(reason: string) {
    super("INVALID_DATE_PROPOSAL", `Date proposal is invalid: ${reason}`, { reason });
  }
}

export class VisibilityViolationError extends DomainError {
  constructor(userId: string, resource: string) {
    super(
      "VISIBILITY_VIOLATION",
      `User ${userId} cannot access ${resource}`,
      { userId, resource }
    );
  }
}
