# Wishy Domain Layer

## Overview

The **domain layer** is the heart of Wishy. It defines what Wishy is and how it works.

- ✅ No React, Zustand, or Supabase dependencies
- ✅ Pure business logic and rules
- ✅ Framework-agnostic and testable
- ✅ Single source of truth for business rules

---

## Core Entities

### **Wish**

Represents a desire (for users with "Wished" role) or an offer (for "Wisher" role).

```typescript
import { Wish, WishStatus, createWish, canModifyWish } from "src/domain";

const wish: Wish = {
  id: "wish-123",
  creatorId: "user-1",
  creatorRole: "wisher",
  title: "Weekend in Paris",
  status: "sent",
  visibility: "connections",
  // ... more fields
};

// Check if wish can be edited (only drafts can)
if (canModifyWish(wish)) {
  // update
}
```

**Statuses:**
- `draft` → Not sent yet
- `sent` → Sent to recipients, awaiting response
- `accepted` → Recipient accepted
- `date_set` → Date has been proposed
- `confirmed` → Both parties confirmed
- `fulfilled` → Completed and rated
- `rejected` → Recipient declined
- `deleted` → Deleted

**Key Rule:** Recipients are NOT stored in Wish. Use `WishRecipient` for that.

---

### **WishRecipient**

Explicit modeling of who receives a wish and their status.

```typescript
import { WishRecipient, RecipientWishStatus } from "src/domain";

const recipient: WishRecipient = {
  id: "recipient-456",
  wishId: "wish-123",
  recipientId: "user-2",
  status: "sent",
  addedAt: "2026-04-12T10:00:00Z",
};
```

**Statuses:**
- `sent` → Wish sent, awaiting response
- `accepted` → Recipient accepted
- `rejected` → Recipient rejected
- `hidden` → Recipient hid from view

**Why separate?**
- Multiple recipients per wish
- Each recipient can have different status
- Recipient-specific actions independent

---

### **Connection**

Represents a relationship between two users.

```typescript
import { Connection, createConnection, isRelationshipConnection } from "src/domain";

const connection: Connection = {
  id: "conn-789",
  user1Id: "user-1", // Always stored in consistent order
  user2Id: "user-2",
  type: "friend", // or "relationship"
  status: "accepted",
  acceptedAt: "2026-04-12T10:00:00Z",
};

if (isRelationshipConnection(connection)) {
  // It's a romantic relationship
}
```

**Key Rule:** Always bidirectional and consistent ordering (lower ID first).

---

### **ConnectionRequest**

Request to connect with another user (unidirectional).

```typescript
import { ConnectionRequest, createConnectionRequest } from "src/domain";

const request: ConnectionRequest = {
  id: "creq-123",
  senderId: "user-1",
  receiverId: "user-2",
  message: "Hi, let's connect!",
  status: "pending",
  sentAt: "2026-04-12T10:00:00Z",
};
```

---

### **RelationshipUpgradeRequest**

Request to upgrade a "friend" connection to "relationship".

```typescript
import { RelationshipUpgradeRequest } from "src/domain";

const upgrade: RelationshipUpgradeRequest = {
  id: "upg-123",
  connectionId: "conn-789",
  requestedBy: "user-1",
  otherUserId: "user-2",
  status: "pending",
  requestedAt: "2026-04-12T10:00:00Z",
};
```

---

## State Machines

### **Wish Lifecycle**

```
draft ──sent──→ accepted ──date_set──→ confirmed ──fulfilled
  │              │                          │
  └─→ rejected ──┘──────────────────────────┘
       ↓
     (no transitions from rejected)
```

Use `isWishTransitionAllowed()` to validate:

```typescript
import { isWishTransitionAllowed } from "src/domain";

if (isWishTransitionAllowed("sent", "accepted")) {
  // Allowed
}
```

### **Recipient Lifecycle**

```
sent ──accepted──→ (can still reject or hide)
  │
  └─→ rejected ──→ (can hide)
       │
       └─→ hidden (terminal)
```

---

## Policies

### **VisibilityPolicy**

Centralized permission logic.

```typescript
import { VisibilityPolicy, ViewerContext } from "src/domain";

const viewer: ViewerContext = {
  userId: "user-2",
  isAuthenticated: true,
  roles: ["user"],
};

if (
  VisibilityPolicy.canViewWish(
    wish,
    viewer,
    connections, // List of viewer's connections
    blockedByIds // Users who blocked the viewer
  )
) {
  // Can view
}
```

**Available checks:**
- `canViewWish()` - Can see wish details?
- `canEditWish()` - Can modify wish?
- `canDeleteWish()` - Can remove wish?
- `canViewProfile()` - Can see user profile?
- `canViewGallery()` - Can see user photos?
- `canAcceptWish()` - Can accept wish?
- `canFulfillWish()` - Can mark as complete?

---

## Domain Errors

All business rule violations throw domain errors.

```typescript
import {
  InvalidWishTransitionError,
  UserNotAuthorizedError,
  VisibilityViolationError,
} from "src/domain";

try {
  // Attempt to transition wish
} catch (error) {
  if (error instanceof InvalidWishTransitionError) {
    console.error("Invalid state transition");
  }
  if (error instanceof UserNotAuthorizedError) {
    console.error("User not allowed");
  }
}
```

---

## Domain Events

Events represent important business occurrences.

```typescript
import { AllDomainEvents, WishSentEvent } from "src/domain";

const event: WishSentEvent = {
  type: "wish.sent",
  aggregateType: "wish",
  aggregateId: "wish-123",
  occurredAt: "2026-04-12T10:00:00Z",
  data: {
    wishId: "wish-123",
    creatorId: "user-1",
    recipientIds: ["user-2", "user-3"],
    title: "Weekend in Paris",
  },
};
```

**Available events:**
- Wish: created, sent, accepted, rejected, dateProposed, dateConfirmed, fulfilled, deleted
- Connection: requestSent, requestAccepted, requestRejected, relationshipUpgradeRequested, relationshipUpgradeConfirmed, userBlocked
- Review: submitted

Events drive:
- Push notifications
- In-app notifications
- UI updates
- Analytics

---

## Usage Examples

### Creating a Wish

```typescript
import { createWish, Wish } from "src/domain";

const newWish = createWish({
  creatorId: "user-1",
  creatorRole: "wisher",
  title: "Weekend trip",
  category: "travel",
});

// newWish.status === "draft"
// newWish.createdAt is current time
```

### Validating a Transition

```typescript
import { isWishTransitionAllowed } from "src/domain";

const currentStatus = "sent";
const nextStatus = "accepted";

if (!isWishTransitionAllowed(currentStatus, nextStatus)) {
  throw new InvalidWishTransitionError(currentStatus, nextStatus);
}
```

### Checking Visibility

```typescript
import { VisibilityPolicy } from "src/domain";

const canView = VisibilityPolicy.canViewWish(
  wish,
  viewer,
  connections,
  blockedByMe
);

if (!canView) {
  throw new VisibilityViolationError(viewer.userId, "wish");
}
```

---

## Key Principles

1. **Single Source of Truth**
   - Each concept has one canonical shape
   - No duplicate fields or encodings

2. **Explicit Over Implicit**
   - Recipients are separate entities (not hidden in links)
   - State transitions are explicit (not scattered in conditionals)
   - Permissions are centralized (not scattered across screens)

3. **No Framework Dependencies**
   - No React
   - No Zustand
   - No Supabase
   - Testable in isolation

4. **Immutable Rules**
   - State machines are enforcement, not suggestions
   - Visibility rules are absolute, not heuristic
   - These rules are the "law" of Wishy

---

## Testing

The domain layer should have comprehensive tests.

```typescript
import { isWishTransitionAllowed, WishStatus } from "src/domain";

describe("WishStatus", () => {
  it("should allow transition from sent to accepted", () => {
    expect(isWishTransitionAllowed("sent", "accepted")).toBe(true);
  });

  it("should not allow transition from sent to draft", () => {
    expect(isWishTransitionAllowed("sent", "draft")).toBe(false);
  });
});
```

---

## Current State

All DDD phases complete:

1. ✅ **Phase 1:** Domain entities, state machines, policies, events
2. ✅ **Phase 2:** Application use cases extracted
3. ✅ **Phase 3:** Infrastructure repositories implemented
4. ✅ **Phase 4:** Screens wired to DDD architecture via hooks

Domain layer is read-only — only the application layer interacts with persistence.
