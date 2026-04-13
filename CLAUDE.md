# Wishy — Developer Memo

> Last updated: 13 April 2026

Wishy is a social wish-sharing iOS app built with Expo + React Native. Users create wishes (for themselves or others), send them to connections, and track fulfillment through a date-proposal / accept / confirm / fulfill lifecycle.

---

# Tech Stack

- **Expo SDK 53** / React Native 0.79.2
- **Nativewind + Tailwind v3** for styling (className prop, cn() helper)
- **@react-navigation/native-stack** for navigation
- **react-native-reanimated v3** for animations
- **Zustand** for auth/user state only (userStore, toastStore)
- **Supabase** via custom PostgREST wrapper (src/api/supabase.ts) — NOT the @supabase/supabase-js SDK
- **EAS Build/Submit** for distribution
- **bun** as package manager (not npm)

---

# Architecture Overview

The app follows a **Clean Architecture** pattern with four layers:

```
src/
├── domain/           # Pure entities & value objects (no dependencies)
├── application/      # Use cases & repository interfaces
├── infrastructure/   # Supabase implementations, DI container, event bus
├── hooks/            # React hooks bridging infrastructure → screens
├── screens/          # UI layer (React components)
│   └── hooks/        # Extracted screen-specific hooks
├── api/              # Supabase REST wrapper, push notifications, AI services
├── state/            # Zustand stores (auth/user only)
├── components/       # Shared UI components
├── types/            # Legacy UI types (wishy.ts)
└── utils/            # Helpers (cn.ts, enrichWishWithRecipients.ts)
```

## Domain Layer (src/domain/)

Pure entities with no framework dependencies:

- **Wish** — id, title, description, category, status, creatorId, creatorRole, imageUrl, location, links, visibility, dates, ratings
- **WishRecipient** — id, wishId, recipientId (join table — a wish can target multiple users)
- **WishStatus** — sent → accepted → date_set → confirmed → fulfilled (or rejected at any point)
- **Connection** — id, senderId, receiverId, status, type
- **ConnectionRequest** — pending connection invitations
- **BlockedUser** — user blocking

**IMPORTANT**: The domain `Wish` entity does NOT have a `targetUserIds` field. Recipients are a separate entity. The UI layer enriches wishes with `targetUserIds` at load time (see Enrichment Pattern below).

## Application Layer (src/application/)

### Use Cases (src/application/wishes/)
- **SendWish** — create wish + create WishRecipient rows + emit "wish.sent"
- **AcceptWish** — update status to accepted + emit "wish.accepted"
- **RejectWish** — update status to rejected + emit "wish.rejected"
- **ProposeWishDate** — set proposed date + emit "wish.dateProposed"
- **ConfirmWishDate** — confirm date + emit "wish.dateConfirmed"
- **FulfillWish** — mark fulfilled with rating + emit "wish.fulfilled"

### Use Cases (src/application/connections/)
- **SendConnectionRequest** — create request + emit event
- **AcceptConnectionRequest** — accept + create Connection
- **BlockUser** — block user + clean up connections

### Repository Interfaces (src/application/shared/RepositoryInterfaces.ts)
- **IWishRepository** — save, findById, findByCreatorId, findRecipientWishes, findAll, update, delete
- **IWishRecipientRepository** — save, findByWishId, **findByWishIds** (batch), findByRecipientId, findByWishAndRecipient, update, delete, deleteByWishId

### ViewModels (src/application/shared/ViewModels.ts)
- **WishViewDTO** — extends Wish with recipients[] and targetUserIds[] for UI consumption

## Infrastructure Layer (src/infrastructure/)

### DIContainer (src/infrastructure/DIContainer.ts)
Singleton that wires all repositories and use cases:
```typescript
const container = DIContainer.getInstance();
container.getWishRepository();      // SupabaseWishRepository
container.getSendWishUseCase();     // wired with repos + event emitter
container.getEventEmitter();        // shared event bus
```

### Supabase Repositories (src/infrastructure/supabase/)
Implement repository interfaces using the PostgREST wrapper:
- SupabaseWishRepository
- SupabaseWishRecipientRepository (includes **findByWishIds** for batch queries)
- SupabaseConnectionRepository
- SupabaseConnectionRequestRepository
- SupabaseBlockedUserRepository
- **mappers/** — convert between Supabase rows and domain entities

### EventEmitter (src/infrastructure/EventEmitter.ts)
Simple pub/sub bus. Use cases emit events, screens subscribe via hooks.

## Hooks Layer (src/hooks/)

Bridge between infrastructure and screens:
- **useDI.ts** — useWishUseCases(), useConnectionUseCases(), useRepositories(), useEventEmitter(), useEventListener(), useEventListeners()
- **useDataSync.ts** — top-level data synchronization (replaces old wishStore)
- **useEventSubscription.ts** — event subscription utilities

## Screen Hooks (src/screens/hooks/)

Complex screens have extracted hooks to reduce component size:
- **useWishDetailActions.ts** (358 lines) — all WishDetailScreen handlers
- **useWishDetailModals.ts** (73 lines) — modal state management
- **useWishDetailComputed.ts** (69 lines) — derived values (connectedUsers, targets, roles)
- **useCreateWishActions.ts** (191 lines) — wish creation + image/link handlers
- **useProfileActions.ts** (173 lines) — photo, role change, logout, delete account
- **useUserProfileComputed.ts** (186 lines) — computed wish filters, statistics, relationships

---

# Key Patterns

## Supabase REST Wrapper (src/api/supabase.ts)

Custom PostgREST client — **NOT @supabase/supabase-js**. Provides `supabaseDb.select()`, `.insert()`, `.update()`, `.delete()`.

**IMPORTANT**: `select()` auto-detects whether the 2nd argument is a direct filter or an options object:
```typescript
// Direct filter (most common) — column values matched with eq. operator
supabaseDb.select("wishes", { id: wishId })
supabaseDb.select("wish_recipients", { wish_id: wishId })

// Array filter — generates PostgREST in.() operator for batch queries
supabaseDb.select("wish_recipients", { wish_id: ["id1", "id2", "id3"] })

// Options object — detected by presence of keys: filter, columns, order, limit, single, rawParams
supabaseDb.select("wishes", { filter: { id: wishId }, order: { column: "created_at", ascending: false } })
```

## Recipient Enrichment Pattern

The domain `Wish` has NO `targetUserIds` field. Recipients are in a separate `wish_recipients` table. Screens must enrich wishes before using them:

```typescript
// For multiple wishes — ONE query via findByWishIds (batch)
import { batchEnrichWishes } from "../utils/enrichWishWithRecipients";
const enrichedWishes = await batchEnrichWishes(wishes, repos.wishRecipientRepository);

// For a single wish
import { enrichSingleWish } from "../utils/enrichWishWithRecipients";
const enrichedWish = await enrichSingleWish(wish, repos.wishRecipientRepository);
```

**DO NOT** use the N+1 pattern (calling findByWishId per wish in a loop). Always use `batchEnrichWishes` for lists.

## State Management Split

- **Zustand** (src/state/) — ONLY for auth/user data (userStore.ts, toastStore.ts). NOT for domain data.
- **Repositories** — all wish, connection, and notification data goes through DI-injected repositories
- The legacy **wishStore was removed**. Do not recreate it.

## Event-Driven Updates

Use cases emit events → screens subscribe and reload:
```typescript
// In a screen
useEventListeners({
  "wish.sent": () => loadUserData(),
  "wish.received": () => loadUserData(),
  "connection.accepted": () => loadUserData(),
});
```

---

# Screens

| Screen | Lines | Purpose |
|--------|-------|---------|
| WishDetailScreen | ~1,490 | Full wish lifecycle — accept, dates, fulfill, ratings |
| ProfileScreen | ~797 | Current user profile, stats, settings |
| UserProfileScreen | ~756 | Other user's profile, shared wishes, statistics |
| CreateWishScreen | ~734 | Create/edit wish form with camera + image picker |
| DiscoveryScreen | ~411 | Browse wishes received from others |
| ChatScreen | ~318 | In-wish messaging between creator and recipient |
| ConnectionsScreen | — | Manage connections |
| MyWishesScreen | — | User's own wishes |
| NotificationsScreen | — | Push notification list |
| ManageConnectionScreen | — | Connection detail/management |

---

# Coding Rules

## Must-Follow
- Use **Pressable** over TouchableOpacity
- Use **double quotes** for strings containing apostrophes (build errors otherwise)
- Use **custom modals**, never Alert.alert()
- Use **useSafeAreaInsets** from react-native-safe-area-context
- Use **Ionicons** from @expo/vector-icons as default icons
- Use **inline styles** (not className) for CameraView and LinearGradient
- Use **individual Zustand selectors** to avoid infinite loops: `const a = useStore(s => s.a)`

## Architecture Rules
- **Domain entities** must have NO framework imports
- **Use cases** are the only way to mutate domain data — screens never call repositories to write
- **Screens read** from repositories directly (via useRepositories hook) but **write** only through use cases
- Always enrich wishes with recipients before passing to UI — use `batchEnrichWishes` or `enrichSingleWish`
- Extract hooks from screens exceeding ~800 lines (handlers → Actions hook, state → Modals hook, useMemo → Computed hook)

## Supabase Rules
- All DB access goes through `supabaseDb` from src/api/supabase.ts
- Repository implementations live in src/infrastructure/supabase/
- Use **mappers** to convert between Supabase row format (snake_case) and domain entities (camelCase)
- For batch queries, pass arrays as filter values — the wrapper generates PostgREST `in.()` operators

---

# File Tree (current as of 13 April 2026)

```
WishyCode2/
├── App.tsx                          # Entrypoint — DIContainer + navigation
├── src/
│   ├── domain/
│   │   ├── wishes/
│   │   │   ├── Wish.ts             # Core wish entity
│   │   │   ├── WishRecipient.ts    # Wish-recipient join entity
│   │   │   └── WishStatus.ts       # Status enum/transitions
│   │   ├── connections/
│   │   │   ├── Connection.ts
│   │   │   ├── ConnectionRequest.ts
│   │   │   ├── BlockedUser.ts
│   │   │   └── RelationshipUpgradeRequest.ts
│   │   └── index.ts                # Re-exports all domain entities
│   │
│   ├── application/
│   │   ├── wishes/
│   │   │   ├── SendWish.ts
│   │   │   ├── AcceptWish.ts
│   │   │   ├── RejectWish.ts
│   │   │   ├── FulfillWish.ts
│   │   │   ├── ProposeWishDate.ts
│   │   │   └── ConfirmWishDate.ts
│   │   ├── connections/
│   │   │   ├── SendConnectionRequest.ts
│   │   │   ├── AcceptConnectionRequest.ts
│   │   │   └── BlockUser.ts
│   │   ├── shared/
│   │   │   ├── RepositoryInterfaces.ts  # IWishRepository, IWishRecipientRepository, etc.
│   │   │   ├── ViewModels.ts            # WishViewDTO
│   │   │   ├── EventEmitter.ts
│   │   │   └── ApplicationError.ts
│   │   └── index.ts
│   │
│   ├── infrastructure/
│   │   ├── DIContainer.ts           # Singleton wiring all repos + use cases
│   │   ├── EventEmitter.ts          # Pub/sub event bus
│   │   └── supabase/
│   │       ├── SupabaseWishRepository.ts
│   │       ├── SupabaseWishRecipientRepository.ts  # includes findByWishIds (batch)
│   │       ├── SupabaseConnectionRepository.ts
│   │       ├── SupabaseConnectionRequestRepository.ts
│   │       ├── SupabaseBlockedUserRepository.ts
│   │       └── mappers/             # Row ↔ entity converters
│   │
│   ├── hooks/
│   │   ├── useDI.ts                 # useWishUseCases, useRepositories, useEventListener, etc.
│   │   ├── useDataSync.ts           # Top-level data sync (replaced wishStore)
│   │   └── useEventSubscription.ts
│   │
│   ├── screens/
│   │   ├── hooks/                   # Extracted screen-specific hooks
│   │   │   ├── useWishDetailActions.ts
│   │   │   ├── useWishDetailModals.ts
│   │   │   ├── useWishDetailComputed.ts
│   │   │   ├── useCreateWishActions.ts
│   │   │   ├── useProfileActions.ts
│   │   │   └── useUserProfileComputed.ts
│   │   ├── WishDetailScreen.tsx
│   │   ├── CreateWishScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── UserProfileScreen.tsx
│   │   ├── DiscoveryScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── ConnectionsScreen.tsx
│   │   ├── MyWishesScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── ManageConnectionScreen.tsx
│   │   ├── LandingScreen.tsx
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ProfileSetupScreen.tsx
│   │   ├── RoleSelectionScreen.tsx
│   │   ├── EditProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── QRCodeScreen.tsx
│   │   └── PushDebugScreen.tsx
│   │
│   ├── api/
│   │   ├── supabase.ts              # Custom PostgREST wrapper (select/insert/update/delete)
│   │   ├── pushNotifications.ts
│   │   ├── chat-service.ts
│   │   ├── openai.ts
│   │   ├── grok.ts
│   │   ├── image-generation.ts
│   │   └── transcribe-audio.ts
│   │
│   ├── state/
│   │   ├── userStore.ts             # Auth + current user (Zustand)
│   │   ├── toastStore.ts            # Toast notifications (Zustand)
│   │   ├── connectionStore.ts
│   │   └── notificationStore.ts
│   │
│   ├── components/
│   │   ├── WishyLogo.tsx
│   │   ├── WishOriginBadge.tsx
│   │   ├── WishDirectionIndicator.tsx
│   │   ├── LocationAutocomplete.tsx
│   │   ├── Toast.tsx
│   │   └── DevAccountSwitcher.tsx
│   │
│   ├── types/
│   │   ├── wishy.ts                 # Legacy UI types (Wish, User, WishCategory, etc.)
│   │   └── ai.ts
│   │
│   └── utils/
│       ├── cn.ts                    # Tailwind className merge helper
│       └── enrichWishWithRecipients.ts  # batchEnrichWishes, enrichSingleWish
│
├── navigation/
│   └── RootNavigator.tsx            # Stack navigator with all routes
│
├── supabase-schema.sql              # Database schema reference
├── package.json
├── tailwind.config.js
├── app.json / eas.json              # Expo + EAS config
└── patches/                         # Expo/RN patches
```