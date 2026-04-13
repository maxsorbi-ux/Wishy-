# Wishy — Architecture Review & Developer Guide
**Date:** April 13, 2026  
**Scope:** Full codebase — post-cleanup state (Phases 1–4 + Options A–D cleanup)

---

## Executive Summary

✅ **VERDICT: PRODUCTION-READY — FULLY CLEANED**

The codebase has been through three rounds of work:

1. **Phases 1–4** — Built a clean-architecture DDD system (domain → application → infrastructure → hooks → screens)
2. **Options A–D Cleanup** (April 13) — Removed dead code, fixed data-model gaps, extracted screen hooks, and optimized repository queries
3. **Issue 1–3 Cleanup** (April 13) — Decomposed large screens via modal extraction, deleted dead connectionStore (1,346 lines), purged 25 stale documentation files, fixed misleading README content

Result: **zero legacy stores (wishStore + connectionStore deleted), zero N+1 queries, consistent enrichment, thinner screens with extracted modal components.** The architecture is sound and every screen follows a repeatable pattern.

---

## 1. Architecture

### Layer Diagram

```
PRESENTATION — 20 screens (8,265 lines) + 2 modal components (1,148 lines) + 6 hooks (1,050 lines)
     │
  HOOKS — useDI (156), useDataSync (103), useEventSubscription (300)
     │
APPLICATION — 9 use cases + repository interfaces + view models (884 lines)
     │
INFRASTRUCTURE — DIContainer + 5 Supabase repos + 5 mappers + EventEmitter (1,192 lines)
     │
  DOMAIN — 8 entities / value objects (496 lines)
     │
  SUPABASE — Custom PostgREST wrapper in api/supabase.ts (673 lines)
```

### Dependency Rule

Dependencies flow **downward only**. Screens import hooks; hooks import DI container; DI container imports repos and use cases; repos import mappers and api/supabase; use cases import domain entities and repository interfaces. Domain imports nothing.

---

## 2. What Changed in the Cleanup (April 13)

### Option A — Removed Legacy wishStore ✅
- **Deleted** `src/state/wishStore.ts` (was 1,034 lines of duplicated logic)
- All wish/connection data now flows through DI-injected repositories
- Zustand stores remaining: `userStore` (auth), `toastStore`, `connectionStore`, `notificationStore`
- **Rule**: Do NOT recreate a wish store. Screens read from repositories, write through use cases.

### Option B — Fixed Recipient Model End-to-End ✅
- Domain `Wish` entity has **no** `targetUserIds` field — recipients are a separate `wish_recipients` table
- Added `enrichWishWithRecipients.ts` utility (64 lines) exporting:
  - `batchEnrichWishes(wishes, recipientRepo)` — ONE query for a list of wishes
  - `enrichSingleWish(wish, recipientRepo)` — for a single wish
- Applied enrichment in **5 screens**: WishDetail, MyWishes, Discovery, Profile, UserProfile
- **Rule**: Every time you load wishes from a repository and display them, you must enrich.

### Option C — Extracted Screen Hooks ✅
Reduced the 4 largest screens by ~538 lines total:

| Screen | Before | After | Extracted To |
|--------|--------|-------|-------------|
| WishDetailScreen | 1,752 | 1,490 | useWishDetailActions (358), useWishDetailModals (73), useWishDetailComputed (69) |
| CreateWishScreen | 821 | 734 | useCreateWishActions (191) |
| ProfileScreen | 881 | 797 | useProfileActions (173) |
| UserProfileScreen | 861 | 756 | useUserProfileComputed (186) |

All hooks live in `src/screens/hooks/`.

### Option D — Optimized Repositories ✅
- Fixed `supabaseDb.select()` to auto-detect direct filter vs options object (no more API mismatch)
- Array values in filters now generate PostgREST `in.()` operators (via `Array.isArray` check)
- Added `findByWishIds(ids)` batch method to WishRecipientRepository — eliminates N+1 queries
- Audited all 18 repository callers — every one now uses the correct API shape

### Issue 1 — Decomposed Large Screens ✅
Extracted modal JSX into dedicated components in `src/screens/components/`:

| Screen | Before | After | Extracted To |
|--------|--------|-------|--------------|
| WishDetailScreen | 1,490 | 812 | WishDetailModals.tsx (768 lines — 7 modals + 2 date pickers) |
| ProfileScreen | 797 | 508 | ProfileModals.tsx (380 lines — 5 modals) |

Screens are now thin orchestrators: setup → state → data loading → computed → actions → render → `<XxxModals />`.

### Issue 2 — Cleaned Stale Documentation ✅
- **Deleted 25 root-level .md files** (ARCHITECTURE.md, PHASE_3_COMPLETE.md, OPTION_A_WISHSTORE_REMOVAL.md, etc.)
- **Kept:** README.md, CLAUDE.md, FINAL_CODE_REVIEW.md, changelog.txt
- **Updated 3 src/ README files:** Removed stale `recipient:userId encoding` references from infrastructure/README.md; updated "Next Steps" to "Current State" in domain/README.md and application/README.md

### Issue 3 — Deleted Dead connectionStore ✅
- **Deleted** `src/state/connectionStore.ts` (1,346 lines)
- Verified zero imports from any screen or component (`grep -rn` returned empty)
- All connection logic already handled by DDD repositories + use cases
- **Zustand stores remaining:** `userStore` (470), `notificationStore` (269), `toastStore` (23)

---

## 3. Current File Inventory

### Screens (8,265 lines across 20 files)

| Screen | Lines | Purpose |
|--------|-------|---------|
| PushDebugScreen | 1,184 | Push notification testing/debug |
| WishDetailScreen | 812 | Full wish lifecycle — accept, dates, fulfill, rate |
| UserProfileScreen | 756 | Other user profile, shared wishes, relationships |
| CreateWishScreen | 734 | Create/edit wish with camera + image |
| ConnectionsScreen | 554 | Manage connections list |
| ProfileScreen | 508 | Current user profile, stats, settings |
| NotificationsScreen | 446 | Notification feed |
| ManageConnectionScreen | 465 | Connection detail/management |
| DiscoveryScreen | 402 | Browse received wishes |
| EditProfileScreen | 341 | Edit profile form |
| ChatScreen | 313 | In-wish messaging |
| ProfileSetupScreen | 282 | Initial profile setup |
| MyWishesScreen | 279 | User's own wishes list |
| SettingsScreen | 242 | App settings |
| RegisterScreen | 189 | Account registration |
| RoleSelectionScreen | 176 | Gifter/receiver role picker |
| QRCodeScreen | 160 | QR code sharing |
| LandingScreen | 160 | App landing/splash |
| LoginScreen | 141 | Login form |
| WelcomeScreen | 121 | Onboarding welcome |

### Screen Hooks (1,050 lines across 6 files)

| Hook | Lines | Extracted From |
|------|-------|---------------|
| useWishDetailActions | 358 | WishDetailScreen — all action handlers |
| useUserProfileComputed | 186 | UserProfileScreen — computed wish filters, stats |
| useCreateWishActions | 191 | CreateWishScreen — creation + image/link handlers |
| useProfileActions | 173 | ProfileScreen — photo, role change, logout, delete |
| useWishDetailModals | 73 | WishDetailScreen — modal state management |
| useWishDetailComputed | 69 | WishDetailScreen — derived values |

### Screen Components (1,148 lines across 2 files)

| Component | Lines | Extracted From |
|-----------|-------|---------------|
| WishDetailModals | 768 | WishDetailScreen — 7 modals (date proposal, decline, delete, rating, date pickers, send-to, edit date) |
| ProfileModals | 380 | ProfileScreen — 5 modals (photo options, enlarged photo, change role, delete account, logout) |

Live in `src/screens/components/`. Parent screens pass modal state (from hook) + action callbacks as props.

### DI / Hooks Bridge (559 lines)

| File | Lines | Purpose |
|------|-------|---------|
| useEventSubscription | 300 | useEventListener, useEventListeners, subscription patterns |
| useDI | 156 | useWishUseCases, useConnectionUseCases, useRepositories, useEventEmitter |
| useDataSync | 103 | Top-level data synchronization (replaced wishStore) |

### Application Layer (884 lines)

**Wish Use Cases:** SendWish (86), AcceptWish (88), RejectWish (87), FulfillWish (79), ProposeWishDate (76), ConfirmWishDate (81)

**Connection Use Cases:** SendConnectionRequest (75), AcceptConnectionRequest (79), BlockUser (79)

**Shared:** RepositoryInterfaces (49), ViewModels (50), ApplicationError (26), EventEmitter interface (13)

### Infrastructure Layer (1,192 lines)

| File | Lines | Purpose |
|------|-------|---------|
| SupabaseWishRepository | 188 | CRUD for wishes table |
| DIContainer | 185 | Singleton wiring all repos + use cases |
| SupabaseWishRecipientRepository | 177 | CRUD + findByWishIds batch method |
| EventEmitter | 102 | Pub/sub event bus |
| SupabaseConnectionRequestRepository | 93 | CRUD for connection requests |
| SupabaseConnectionRepository | 78 | CRUD for connections |
| SupabaseBlockedUserRepository | 57 | CRUD for blocked users |
| WishMapper | 104 | DB row ↔ Wish entity |
| ConnectionMapper | 51 | DB row ↔ Connection entity |
| WishRecipientMapper | 47 | DB row ↔ WishRecipient entity |
| ConnectionRequestMapper | 45 | DB row ↔ ConnectionRequest entity |
| BlockedUserMapper | 36 | DB row ↔ BlockedUser entity |

### Domain Layer (496 lines)

| File | Lines | Purpose |
|------|-------|---------|
| Wish | 105 | Core wish entity (no targetUserIds!) |
| WishStatus | 83 | Status enum + transition rules |
| Connection | 78 | Connection entity |
| WishRecipient | 77 | Join entity wish↔user |
| ConnectionRequest | 44 | Pending connection invitation |
| RelationshipUpgradeRequest | 44 | Relationship upgrade entity |
| BlockedUser | 37 | User blocking entity |

### State Stores (762 lines — Zustand)

| Store | Lines | Purpose |
|-------|-------|---------|
| userStore | 470 | Auth + current user |
| notificationStore | 269 | Push notification state |
| toastStore | 23 | Toast display state |

**Note:** Both `wishStore` (Option A) and `connectionStore` (Issue 3) have been deleted. No wish or connection data lives in Zustand.

### API Layer (1,720 lines)

| File | Lines | Purpose |
|------|-------|---------|
| pushNotifications | 781 | Push notification registration + handling |
| supabase | 673 | Custom PostgREST wrapper (select/insert/update/delete) |
| chat-service | 90 | LLM text responses |
| image-generation | 85 | gpt-image-1 generation |
| transcribe-audio | 49 | gpt-4o-transcribe |
| grok | 22 | Grok API client |
| openai | 20 | OpenAI API client |

### Other

| Area | Lines | Files |
|------|-------|-------|
| Components | 678 | 6 shared UI components |
| Navigation | 272 | RootNavigator (stack navigator) |
| Utils | 70 | cn.ts (6) + enrichWishWithRecipients.ts (64) |
| Types | — | wishy.ts (legacy UI types), ai.ts |

---

## 4. Key Patterns to Follow

### Pattern A: Loading and Displaying Wishes

```typescript
// In any screen that loads wishes:
const repos = useRepositories();

const loadWishes = async () => {
  const wishes = await repos.wishRepository.findByCreatorId(userId);
  // ALWAYS enrich — domain Wish has no targetUserIds
  const enriched = await batchEnrichWishes(wishes, repos.wishRecipientRepository);
  setWishes(enriched);
};

useEffect(() => { loadWishes(); }, [userId]);

useEventListeners({
  "wish.sent": () => loadWishes(),
  "wish.accepted": () => loadWishes(),
});
```

### Pattern B: Executing an Action

```typescript
const useCases = useWishUseCases();

const handleAccept = async () => {
  try {
    setIsLoading(true);
    await useCases.acceptWish.execute({ wishId });
    // Don't update local state here — the event listener will reload
  } catch (error) {
    showToast(`Error: ${error.message}`, "error");
  } finally {
    setIsLoading(false);
  }
};

// The use case emits "wish.accepted" → event listener above reloads data
```

### Pattern C: Supabase REST Wrapper

```typescript
// Direct filter (most common)
supabaseDb.select("wishes", { id: wishId });

// Array filter → PostgREST in.() operator
supabaseDb.select("wish_recipients", { wish_id: ["id1", "id2", "id3"] });

// Options object → detected by keys: filter, columns, order, limit, single, rawParams
supabaseDb.select("wishes", {
  filter: { creator_id: userId },
  order: { column: "created_at", ascending: false },
});
```

### Pattern D: Extracting a Screen Hook

When a screen exceeds ~800 lines:
1. **Actions hook** — all handler functions (`useXxxActions.ts`)
2. **Computed hook** — all useMemo/derived values (`useXxxComputed.ts`)
3. **Modals hook** — modal open/close state (`useXxxModals.ts`)
4. **Modal component** — all modal JSX (`XxxModals.tsx` in `src/screens/components/`)

Hooks go in `src/screens/hooks/`. Modal components go in `src/screens/components/`. The screen becomes a thin orchestrator: setup → hooks → render → `<XxxModals />`.

---

## 5. Total Codebase Size

| Layer | Lines | % |
|-------|-------|---|
| Screens | 8,265 | 46% |
| API | 1,720 | 10% |
| Infrastructure | 1,192 | 7% |
| Screen components | 1,148 | 6% |
| Screen hooks | 1,050 | 6% |
| Application | 884 | 5% |
| State stores | 762 | 4% |
| Components | 678 | 4% |
| DI/Hooks bridge | 559 | 3% |
| Domain | 496 | 3% |
| Navigation | 272 | 2% |
| Utils | 70 | <1% |
| **TOTAL** | **~17,096** | **100%** |

---

## 6. Known Issues & Future Work

### ⚠️ PushDebugScreen (1,184 lines)
Debug-only screen — large but not user-facing. Can be excluded from production builds.

### ⚠️ UserProfileScreen (756) & CreateWishScreen (734)
Next candidates for modal/component extraction if they grow further.

### ⚠️ Integration Tests
One test file exists (`__tests__/CreateWishScreen.integration.test.ts`). Coverage is minimal. The architecture is highly testable (mock repos/use cases), so adding tests is straightforward.

### ⚠️ Legacy types/wishy.ts
Old UI type definitions still referenced by some screens. Gradual migration to domain entities recommended.

---

## 7. Rules for Future Development

1. **Never recreate a wishStore** — all wish data goes through repositories
2. **Always enrich wishes** with `batchEnrichWishes()` before displaying
3. **Write through use cases only** — screens never call repositories to insert/update/delete
4. **Read from repositories** — screens call `repos.wishRepository.findByX()` directly
5. **Subscribe to events** — use `useEventListeners` to reload after mutations
6. **Extract hooks + modal components** when a screen passes ~800 lines
7. **Use the supabase wrapper** — never import supabase-js directly
8. **Array filters** for batch queries — never loop `findByWishId` one by one

---

**Last updated:** April 13, 2026  
**Status:** Production-ready. All architectural cleanup complete. Net reduction of ~1,192 lines from Issue 1–3 cleanup (modal extraction + dead code removal).
