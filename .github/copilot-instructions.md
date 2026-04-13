## Purpose

Provide quick, project-specific guidance for AI coding agents working on Wishy (Expo React Native app).

## Big picture
- Expo + React Native mobile app (iOS-focused) — entrypoint: [App.tsx](WishyCode2/App.tsx#L1).
- UI: Nativewind (Tailwind) + `cn()` helper at [src/utils/cn.ts](WishyCode2/src/utils/cn.ts#L1).
- Navigation: centralised in [src/navigation/RootNavigator.tsx](WishyCode2/src/navigation/RootNavigator.tsx#L1).
- Backend/integration layer: `src/api/*` (examples: [src/api/supabase.ts](WishyCode2/src/api/supabase.ts#L1), [src/api/openai.ts](WishyCode2/src/api/openai.ts#L1), [src/api/chat-service.ts](WishyCode2/src/api/chat-service.ts#L1)).
- State: `zustand` stores live in `src/state/` and use AsyncStorage persistence where appropriate (see `src/state/*`).

## Key conventions (project-specific)
- Always use double quotes for strings (project has historically required this).
- Prefer `Pressable` over `TouchableOpacity` for touchables.
- Use `className` (Nativewind) for layout/styling; when merging conditional classes use `cn()` helper.
- Exceptions: use inline `style` for `CameraView`, `LinearGradient`, and Animated components (Nativewind may break these).
- Use prebuilt implementations in `src/api/` (image-generation, transcribe-audio, chat-service) instead of reinventing API clients.
- Keep state files inside `src/state/` and avoid persisting everything — persist only necessary session or preferences.

## Developer workflows / commands
- Start local dev: `bun` or `npm`/`yarn` run `expo start` — scripts available in [package.json](WishyCode2/package.json#L1).
- Run platform builds: `expo run:android` / `expo run:ios` (see `package.json`).
- Lint/typecheck: `expo lint` and `tsc --noEmit`.
- EAS / build metadata referenced in [README.md](WishyCode2/README.md#L1).

## Integration points & notable files
- Auth, DB, storage & real-time: `src/api/supabase.ts` (Supabase is source-of-truth).
- LLMs & multimodal: `src/api/openai.ts`, `src/api/grok.ts`, `src/api/image-generation.ts`, `src/api/transcribe-audio.ts`.
- Chat orchestration: `src/api/chat-service.ts`.
- Screens live under `src/screens/` and demonstrate UI/state patterns (e.g. `ChatScreen.tsx`, `WishDetailScreen.tsx`).

## Constraints / Do Not Modify
- Do not change template/forbidden files listed in project docs: `patches/`, `babel.config.js`, `metro.config.js`, `tsconfig.json`, `app.json`, `.prettierrc`, `.eslintrc.js`, `.gitignore`.
- Do not expose environment variables or API keys in code or responses.

## Quick examples
- Import `cn` and use Nativewind:

```ts
import { cn } from "./src/utils/cn";
<View className={cn("p-4", condition && "bg-blue-50")}></View>
```

## What to ask the user when unclear
- Which backend credentials (if any) are safe to use or mock locally?
- Are we allowed to add dependencies (this repo prefers using existing libs)?
- Should UI follow Apple HIG strictly (iOS-focused tweaks) or be cross-platform parity?

---
If you'd like, I can tighten any section or add short examples from files you care about. What should I clarify next?
