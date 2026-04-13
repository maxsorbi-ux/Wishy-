# Application Layer

The application layer contains **use cases** that orchestrate domain logic with repositories.

## Key Principle

Use cases are the **bridge** between:
- **Domain:** Rules and entities
- **Infrastructure:** Persistence and events

Use cases:
- ✅ Call domain functions
- ✅ Call repositories
- ✅ Emit domain events
- ❌ Never know about React, Zustand, or Supabase directly

---

## Use Cases

### Wish Use Cases

#### **AcceptWish**
Recipient accepts a wish.

```typescript
import { AcceptWishUseCase } from "src/application";

const useCase = new AcceptWishUseCase(wishRepo, recipientRepo, eventEmitter);
await useCase.execute({
  wishId: "wish-123",
  recipientId: "user-2",
});
```

#### **SendWish**
Creator sends a draft wish to recipients.

```typescript
const useCase = new SendWishUseCase(wishRepo, recipientRepo, eventEmitter);
await useCase.execute({
  wishId: "wish-123",
  creatorId: "user-1",
  recipientIds: ["user-2", "user-3"],
});
```

#### **RejectWish**
Recipient rejects a wish.

```typescript
const useCase = new RejectWishUseCase(wishRepo, recipientRepo, eventEmitter);
await useCase.execute({
  wishId: "wish-123",
  recipientId: "user-2",
});
```

#### **FulfillWish**
Recipient marks wish as fulfilled and rates it.

```typescript
const useCase = new FulfillWishUseCase(wishRepo, recipientRepo, eventEmitter);
await useCase.execute({
  wishId: "wish-123",
  fulfilledBy: "user-2",
  rating: 5,
  praised: true,
  review: "It was amazing!",
});
```

#### **ProposeWishDate**
Creator or recipient proposes a date/time.

```typescript
const useCase = new ProposeWishDateUseCase(wishRepo, eventEmitter);
await useCase.execute({
  wishId: "wish-123",
  proposedBy: "user-1",
  date: "2026-04-20",
  time: "14:30",
});
```

#### **ConfirmWishDate**
Creator or recipient confirms the proposed date.

```typescript
const useCase = new ConfirmWishDateUseCase(wishRepo, eventEmitter);
await useCase.execute({
  wishId: "wish-123",
  confirmedBy: "user-2",
});
```

---

### Connection Use Cases

#### **SendConnectionRequest**
User sends a connection request.

```typescript
import { SendConnectionRequestUseCase } from "src/application";

const useCase = new SendConnectionRequestUseCase(requestRepo, eventEmitter);
const requestId = await useCase.execute({
  senderId: "user-1",
  receiverId: "user-2",
  message: "Let's connect!",
});
```

#### **AcceptConnectionRequest**
User accepts a connection request.

```typescript
import { AcceptConnectionRequestUseCase } from "src/application";

const useCase = new AcceptConnectionRequestUseCase(requestRepo, connectionRepo, eventEmitter);
const connectionId = await useCase.execute({
  requestId: "creq-123",
  connectionType: "friend", // or "relationship"
});
```

#### **BlockUser**
User blocks another user.

```typescript
import { BlockUserUseCase } from "src/application";

const useCase = new BlockUserUseCase(connectionRepo, blockedRepo, eventEmitter);
await useCase.execute({
  blockerId: "user-1",
  blockedUserId: "user-2",
});
```

---

## Repository Interfaces

Use cases depend on repositories, which have these interfaces:

### **IWishRepository**
```typescript
interface IWishRepository {
  save(wish: Wish): Promise<Wish>;
  findById(wishId: string): Promise<Wish | null>;
  findByCreatorId(creatorId: string): Promise<Wish[]>;
  findRecipientWishes(userId: string): Promise<Wish[]>;
  update(wish: Wish): Promise<void>;
  delete(wishId: string): Promise<void>;
}
```

### **IWishRecipientRepository**
```typescript
interface IWishRecipientRepository {
  save(recipient: WishRecipient): Promise<WishRecipient>;
  findByWishId(wishId: string): Promise<WishRecipient[]>;
  findByWishAndRecipient(wishId: string, recipientId: string): Promise<WishRecipient | null>;
  update(recipient: WishRecipient): Promise<void>;
  delete(recipientId: string): Promise<void>;
}
```

### **IConnectionRepository**
```typescript
interface IConnectionRepository {
  save(connection: Connection): Promise<Connection>;
  findById(id: string): Promise<Connection | null>;
  findByUserPair(user1Id: string, user2Id: string): Promise<Connection | null>;
}
```

### **IConnectionRequestRepository**
```typescript
interface IConnectionRequestRepository {
  save(request: ConnectionRequest): Promise<ConnectionRequest>;
  findById(id: string): Promise<ConnectionRequest | null>;
  findBySenderAndReceiver(senderId: string, receiverId: string): Promise<ConnectionRequest | null>;
}
```

---

## Event Emission

All use cases emit domain events:

```typescript
const event: WishAcceptedEvent = {
  type: "wish.accepted",
  aggregateType: "wish",
  aggregateId: input.wishId,
  occurredAt: new Date().toISOString(),
  data: { /* ... */ },
};

this.eventEmitter.emit(event);
```

Events drive:
- Push notifications (when recipient accepts wish)
- In-app notifications (creator sees acceptance)
- Chat creation (auto-create when wish accepted)
- UI updates (re-render based on new status)

---

## Error Handling

Use cases throw domain errors:

```typescript
import { InvalidWishTransitionError, UserNotAuthorizedError } from "src/domain";

try {
  await useCase.execute(input);
} catch (error) {
  if (error instanceof InvalidWishTransitionError) {
    // Handle state error
  }
  if (error instanceof UserNotAuthorizedError) {
    // Handle permission error
  }
}
```

---

## Dependency Injection

Use cases are instantiated with dependencies:

```typescript
// In your setup code
const wishRepo = new SupabaseWishRepository();
const recipientRepo = new SupabaseWishRecipientRepository();
const eventEmitter = new EventEmitter();

// Create use case
const acceptWish = new AcceptWishUseCase(wishRepo, recipientRepo, eventEmitter);

// Use it
await acceptWish.execute({ wishId: "...", recipientId: "..." });
```

---

## Integration with Screens

Screens call use cases and react to events:

```tsx
// In a screen
const acceptWish = useAcceptWishUseCase(); // from some hook

const handleAccept = async () => {
  try {
    await acceptWish.execute({ wishId, recipientId });
    // Success toast handled by event listener
  } catch (error) {
    showErrorToast(error.message);
  }
};
```

---

## Current State

All DDD phases complete:

1. ✅ **Phase 3:** Repositories implemented in `infrastructure/` layer
2. ✅ **Phase 4:** Screens wired to use cases via hooks
3. 🔲 **Tests:** Domain and use case unit tests (future work)
