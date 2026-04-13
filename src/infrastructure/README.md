## Phase 3: Infrastructure Layer (COMPLETE)

### Deliverables

**Supabase Mappers** (Bridge between database schema and domain entities)
- [WishMapper.ts](supabase/mappers/WishMapper.ts) — Converts Wish rows ↔ domain entities, handles recipient encoding
- [WishRecipientMapper.ts](supabase/mappers/WishRecipientMapper.ts) — Converts WishRecipient rows
- [ConnectionMapper.ts](supabase/mappers/ConnectionMapper.ts) — Converts Connection rows
- [ConnectionRequestMapper.ts](supabase/mappers/ConnectionRequestMapper.ts) — Converts ConnectionRequest rows  
- [BlockedUserMapper.ts](supabase/mappers/BlockedUserMapper.ts) — Converts BlockedUser rows

**Repositories** (Persistence implementations)
- [SupabaseWishRepository.ts](supabase/SupabaseWishRepository.ts) — Wish CRUD via Supabase
- [SupabaseWishRecipientRepository.ts](supabase/SupabaseWishRecipientRepository.ts) — WishRecipient CRUD
- [SupabaseConnectionRepository.ts](supabase/SupabaseConnectionRepository.ts) — Connection CRUD
- [SupabaseConnectionRequestRepository.ts](supabase/SupabaseConnectionRequestRepository.ts) — ConnectionRequest CRUD
- [SupabaseBlockedUserRepository.ts](supabase/SupabaseBlockedUserRepository.ts) — BlockedUser CRUD

**Event System**
- [EventEmitter.ts](EventEmitter.ts) — Pub/sub for domain events, implements IEventEmitter interface

**Dependency Injection**
- [DIContainer.ts](DIContainer.ts) — Singleton that wires repositories + use cases + event emitter

### Architecture

```
Application Layer (Phase 2)
├── SendWishUseCase
├── AcceptWishUseCase
├── ... (9 total use cases)
└── Expects: IWishRepository, IEventEmitter, etc.
     ↓
Infrastructure Layer (Phase 3 - THIS)
├── Repositories (implement interfaces from Phase 2)
│   ├── SupabaseWishRepository
│   ├── SupabaseConnectionRequestRepository
│   └── ... (5 total)
├── Mappers (convert Supabase rows ↔ domain entities)
└── DIContainer (wires it all)
     ↓
Supabase (database)
├── wishes table
├── wish_recipients table
├── connections table
├── connection_requests table
└── blocked_users table
```

### Key Design Decisions

1. **Mappers Handle Schema Translation**
   - Supabase schema uses dedicated `wish_recipients` table
   - Mappers convert between database rows and domain entities
   - Clean 1:1 mapping with no encoding workarounds

2. **Repositories Are Thin**
   - No business logic
   - Only CRUD + specialized queries (findByUserPair, etc.)
   - Use cases enforce all invariants

3. **Event Emitter Interface**
   - Simple pub/sub: `on(eventType, handler)` and `emit(event)`
   - Use cases emit events after successful operations
   - No handlers registered yet (handled in Phase 4 with screens)

4. **DI Container is Singleton**
   - Single instance created lazily: `DIContainer.getInstance()`
   - Registers all repositories and use cases
   - Screens access use cases through container

### Integration Path (Phase 4)

```typescript
// In a screen component:
const container = DIContainer.getInstance();
const sendWishUseCase = container.getSendWishUseCase();

// Subscribe to events:
container.getEventEmitter().on("wish.sent", (event) => {
  // Show success toast, refresh UI, etc.
});

// Execute use case:
await sendWishUseCase.execute({ wishId, creatorId, recipientIds });
```

### Status

✅ All repositories implement application layer interfaces  
✅ All mappers handle Supabase schema conversion  
✅ Event emitter ready for subscription  
✅ DI container wires everything together  
✅ No TypeScript compilation errors (module resolution pending rebuild)  

### Current State

All phases complete. Screens use DDD use cases via hooks. The monolithic stores (wishStore, connectionStore) have been removed.
