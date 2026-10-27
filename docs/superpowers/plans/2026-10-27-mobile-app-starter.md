# Mobile App Starter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Starter: a working Expo app with Password Sign-in against a Fake Auth Backend, Second Factor, Sign-up, Password Reset, Account Deletion, Home and Account Screen tabs, one Theme, and a new-app command that creates Derived Apps.

**Architecture:** Every Sign-in and Account action goes through one `AuthBackend` interface (the seam). The app talks to it only through `AuthProvider`/`useAuth()`, which turns results into a signed-in or signed-out state. Expo Router's `Stack.Protected` shows the signed-out screens or the two tabs. Screens style themselves only from `useTheme()`.

**Tech Stack:** Expo (latest stable SDK), TypeScript, Expo Router, expo-secure-store, AsyncStorage, expo-apple-authentication, @react-native-google-signin/google-signin, expo-font with IBM Plex Sans, Jest (jest-expo) with React Native Testing Library and `expo-router/testing-library`.

**Spec:** `.scratch/mobile-app-starter/spec.md`. Vocabulary: `GLOSSARY.md`. Decisions: `docs/adr/0001-*.md`, `docs/adr/0002-*.md`.

## Global Constraints

- Expo latest stable SDK at build time. Add every Expo/React Native dependency with `npx expo install` so versions match the SDK. Use npm.
- `ios/` and `android/` are generated and never committed (ADR 0001).
- Built-in `StyleSheet` and one Theme; no UI or styling library. Screens use only Theme values, never raw colors, font sizes, font families or spacing (ADR 0002).
- Text contrast at least 4.5:1 in light and dark; tap targets at least 44 points; form fields have visible labels; errors appear next to the field they belong to.
- Use glossary terms in code, tests and copy. The UI says "Sign in", never "login" or "log in".
- The Starter contains no keys. Keys live in `.env.local`, which git ignores.
- Password Reset shows the same message whether or not an Account exists.
- Test files never go inside `app/` (Expo Router treats every file there as a route).
- `npm test` runs on any machine with no emulator.
- Starter App Identity: name `Mobile App Starter`, slug `mobile-app-starter`, scheme `mobileappstarter`, iOS bundle ID and Android package `com.example.mobileappstarter`.
- Settled open questions from the spec: Sign-up may return `confirmation-required` (the Fake never does); demo Accounts `demo@example.com` / `Password123!` and `demo-2fa@example.com` / `Password123!` with Second Factor code `123456`, shown on the sign-in screen whenever the Fake Auth Backend is active; a Sign-in is recent for 5 minutes; passwords need at least 8 characters.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Email typed with different case or spaces** (`  Demo@Example.COM `): treated as the same Account for Sign-in, Sign-up ("already in use") and Password Reset. Pinned in Task 3.
2. **Tapping a submit button twice quickly**: sends one request, not two. Pinned in Task 5 (Button) and Task 6 (sign-in screen).
3. **Auth Backend throws instead of returning a result**: the screen shows the "couldn't reach the server" message, keeps what was typed and doesn't crash. Pinned in Task 4 and Task 6.
4. **Restart after an old Sign-in**: a session restored after a restart keeps its original Sign-in time, so Account Deletion still asks for a recent Sign-in. Pinned in Task 3.
5. **new-app with a bad identifier or an existing folder** (`com.my-company.app`, a folder that already has files): refuses with a clear message and writes nothing. Pinned in Task 9.

---

### Task 1: Expo project, App Identity and Sign-in Methods config

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `assets/` (from the Expo template)
- Create: `app-identity.json`, `app.config.ts`, `jest.config.js`
- Create: `app/_layout.tsx`, `app/index.tsx` (temporary placeholders, replaced in Task 6)
- Test: `app.config.test.ts`

**Interfaces:**
- Produces:
  - `app-identity.json`: `{ "name", "slug", "scheme", "iosBundleId", "androidPackage" }` holding the Starter App Identity from Global Constraints. Task 9 reads and rewrites this file.
  - In `app.config.ts`:
    - `export type AppIdentity = { name: string; slug: string; scheme: string; iosBundleId: string; androidPackage: string }`
    - `export type SignInMethodsConfig = { password: boolean; google: boolean; apple: boolean }`
    - `export const signInMethods: SignInMethodsConfig = { password: true, google: false, apple: false }`
    - `export function buildConfig(base: ExpoConfig, options: { identity: AppIdentity; signInMethods: SignInMethodsConfig; env: Record<string, string | undefined> }): ExpoConfig`
  - Config `extra`: `{ signInMethods: SignInMethodsConfig; googleWebClientId: string | null }`. Task 4 reads it.
  - Path alias `@/*` maps to `src/*` in `tsconfig.json`, with a matching Jest `moduleNameMapper`.

- [ ] **Step 1: Scaffold.** Run `npx create-expo-app@latest .starter-tmp --template blank-typescript --no-install`. Move its `package.json`, `tsconfig.json`, `.gitignore` and `assets/` into the repo root, then delete `.starter-tmp`. Don't keep `App.tsx`, `index.ts` or `app.json`; their icon and splash settings move into `app.config.ts`. Then run `npm install`.
- [ ] **Step 2: Install dependencies.**
  - Run `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-splash-screen expo-dev-client`.
  - Run `npx expo install jest-expo jest @testing-library/react-native @types/jest -- --save-dev`.
  - In `package.json`, set `"main": "expo-router/entry"` and add the scripts `"test": "jest"` and `"typecheck": "tsc --noEmit"`.
  - In `jest.config.js`, use `preset: 'jest-expo'` and map `^@/(.*)$` to `<rootDir>/src/$1`.
  - Make sure `.gitignore` has `/ios`, `/android` and `.env*.local`.
- [ ] **Step 3: Write the failing test** in `app.config.test.ts`:

```ts
const base = { name: '', slug: '' };
const identity = require('./app-identity.json');
const off = { password: true, google: false, apple: false };

// Assert against app-identity.json, never literals: this test is copied into every Derived App.
it('applies the App Identity', () => {
  const c = buildConfig(base, { identity, signInMethods: off, env: {} });
  expect([c.name, c.slug, c.scheme]).toEqual([identity.name, identity.slug, identity.scheme]);
  expect(c.ios?.bundleIdentifier).toBe(identity.iosBundleId);
  expect(c.android?.package).toBe(identity.androidPackage);
  expect(c.userInterfaceStyle).toBe('automatic');
  expect(c.extra).toEqual({ signInMethods: off, googleWebClientId: null });
});
it('refuses Google without keys', () => {
  expect(() => buildConfig(base, { identity, signInMethods: { ...off, google: true }, env: {} }))
    .toThrow(/EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID/);
});
it('adds the Google plugin and client ID when keys are present', () => {
  const env = { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-id', GOOGLE_IOS_URL_SCHEME: 'com.googleusercontent.apps.x' };
  const c = buildConfig(base, { identity, signInMethods: { ...off, google: true }, env });
  expect(c.plugins).toContainEqual(['@react-native-google-signin/google-signin', { iosUrlScheme: 'com.googleusercontent.apps.x' }]);
  expect(c.extra?.googleWebClientId).toBe('web-id');
});
it('switches on Apple', () => {
  const c = buildConfig(base, { identity, signInMethods: { ...off, apple: true }, env: {} });
  expect(c.ios?.usesAppleSignIn).toBe(true);
  expect(c.plugins).toContain('expo-apple-authentication');
});
```

- [ ] **Step 4: Run it and see it fail.** Run `npx jest app.config.test.ts`. Expected: FAIL, because `buildConfig` isn't defined.
- [ ] **Step 5: Implement `buildConfig` and the default export.**
  - The default export is `({ config }) => buildConfig(config, { identity, signInMethods, env: process.env })`.
  - Keep the template's icon and splash settings.
  - The plugins always include `expo-router` and `expo-secure-store`.
  - When Google is on, require both `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `GOOGLE_IOS_URL_SCHEME`. The error message names each missing variable.
  - Put a comment above `signInMethods` saying this is where a Derived App switches on Google or Apple.
- [ ] **Step 6: Run it and see it pass.** Run `npx jest app.config.test.ts`. Expected: PASS (4 tests).
- [ ] **Step 7: Add placeholder routes.** `app/_layout.tsx` renders `<Stack />`, and `app/index.tsx` renders the text "Mobile App Starter". Run `npx expo config --type public`; the output includes `name: 'Mobile App Starter'`. Run `npx expo-doctor`; all checks pass. Run `npm run typecheck`; there are no errors.
- [ ] **Step 8: Commit.** Commit everything, including the existing `CLAUDE.md`, `.claude/`, `GLOSSARY.md`, `docs/` and `.scratch/`. Use the message `chore: scaffold Expo app with App Identity and Sign-in Methods config`.

### Task 2: Theme

**Files:**
- Create: `src/theme/theme.ts`, `src/theme/contrast.ts`, `src/theme/fonts.ts`, `src/theme/ThemeProvider.tsx`
- Test: `src/theme/theme.test.ts`, `src/theme/ThemeProvider.test.tsx`, `src/theme/no-raw-style-values.test.ts`

**Interfaces:**
- Produces:
  - `export type Theme = { colors: { background; surface; text; textMuted; primary; onPrimary; link; border; danger; onDanger; focus }; fonts: { regular; medium; bold }; textSizes: { small: 14; body: 16; heading: 20; title: 28 }; spacing: { xs: 4; sm: 8; md: 16; lg: 24; xl: 32 }; radius: { sm: 6; md: 10 }; minTapTarget: 44 }`. All colors and fonts are strings.
  - `export const lightTheme: Theme` and `export const darkTheme: Theme`
  - `export function contrastRatio(foreground: string, background: string): number`, using the WCAG relative-luminance formula on `#RRGGBB`
  - `export const fontAssets`: the map to pass to `useFonts()` (Task 6)
  - `export function ThemeProvider(props: { children: ReactNode }): JSX.Element`, which follows `useColorScheme()` (`'dark'` gives dark; anything else gives light)
  - `export function useTheme(): Theme`

The light colors come from the `ui-ux-pro-max` design system (Minimalism & Swiss Style):

| Token | Light | Dark |
|---|---|---|
| background | `#F8FAFC` | `#020617` |
| surface | `#FFFFFF` | `#0F172A` |
| text | `#020617` | `#F8FAFC` |
| textMuted | `#475569` | `#94A3B8` |
| primary | `#0F172A` | `#E2E8F0` |
| onPrimary | `#FFFFFF` | `#0F172A` |
| link | `#1E3A8A` | `#93C5FD` |
| border | `#E2E8F0` | `#1E293B` |
| danger | `#DC2626` | `#F87171` |
| onDanger | `#FFFFFF` | `#020617` |
| focus | `#0F172A` | `#E2E8F0` |

The fonts are IBM Plex Sans from `@expo-google-fonts/ibm-plex-sans`: `IBMPlexSans_400Regular`, `IBMPlexSans_500Medium` and `IBMPlexSans_700Bold`.

- [ ] **Step 1: Install the fonts.** Run `npx expo install expo-font @expo-google-fonts/ibm-plex-sans`.
- [ ] **Step 2: Write the failing tests.**

```ts
// theme.test.ts
it('measures contrast', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  expect(contrastRatio('#777777', '#FFFFFF')).toBeLessThan(4.5);
});
const pairs = [['text','background'],['text','surface'],['textMuted','background'],['textMuted','surface'],
  ['onPrimary','primary'],['onDanger','danger'],['link','background'],['danger','background'],['danger','surface']] as const;
it.each([['light', lightTheme], ['dark', darkTheme]])('%s theme text is readable', (_, t) => {
  for (const [fg, bg] of pairs) expect(contrastRatio(t.colors[fg], t.colors[bg])).toBeGreaterThanOrEqual(4.5);
});
it('light and dark have the same shape', () => {
  expect(Object.keys(darkTheme.colors).sort()).toEqual(Object.keys(lightTheme.colors).sort());
  expect(lightTheme.minTapTarget).toBe(44);
});

// ThemeProvider.test.tsx: mock react-native's useColorScheme
it.each([['dark', darkTheme], ['light', lightTheme], [null, lightTheme]])('scheme %s gives the matching Theme', ...);

// no-raw-style-values.test.ts (@jest-environment node)
// Walk app/ and src/ for .ts/.tsx, skipping src/theme/, src/test-utils/ and *.test.*. Collect lines matching:
//   /#[0-9a-fA-F]{3,8}\b/, /rgba?\(/, /fontSize:\s*\d/, /fontFamily:\s*['"]/,
//   /(margin|padding)\w*:\s*[1-9]/, /gap:\s*[1-9]/, /borderRadius:\s*[1-9]/
it('screens use only Theme values', () => expect(findRawStyleValues()).toEqual([]));
```

- [ ] **Step 3: Run them and see them fail.** Run `npx jest src/theme`. Expected: FAIL, because the modules don't exist yet.
- [ ] **Step 4: Implement** `theme.ts`, `contrast.ts`, `fonts.ts` and `ThemeProvider.tsx` with the values above.
- [ ] **Step 5: Run them and see them pass.** Run `npx jest src/theme`. Expected: PASS. If a contrast pair fails, adjust only the dark value and record the change in the commit message.
- [ ] **Step 6: Commit.** Message: `feat: add light and dark Theme with contrast checks`.

### Task 3: Auth Backend seam and Fake Auth Backend

**Files:**
- Create: `src/auth/types.ts`, `src/auth/storage.ts`, `src/auth/password-rules.ts`, `src/auth/fake/demo-accounts.ts`, `src/auth/fake/createFakeAuthBackend.ts`
- Test: `src/auth/fake/createFakeAuthBackend.test.ts`

**Interfaces:**
- Produces (`src/auth/types.ts`). This is the seam; every later task uses these names:

```ts
export type SignInMethod = 'password' | 'google' | 'apple';
export type Account = { id: string; email: string; method: SignInMethod };
export type Session = { account: Account; signedInAt: number };
export type ProviderIdentity = { provider: 'google' | 'apple'; subject: string; idToken: string; email: string | null };
export type Unreachable = { status: 'unreachable' };
export type SignedIn = { status: 'signed-in'; session: Session };
export type SignUpResult = SignedIn | { status: 'confirmation-required' } | { status: 'email-in-use' } | { status: 'weak-password' } | Unreachable;
export type PasswordSignInResult = SignedIn | { status: 'second-factor-required'; challengeId: string } | { status: 'wrong-credentials' } | Unreachable;
export type SecondFactorResult = SignedIn | { status: 'wrong-code' } | Unreachable;
export type ProviderSignInResult = SignedIn | Unreachable;
export type PasswordResetResult = { status: 'sent' } | Unreachable;
export type ReauthProof = { kind: 'password'; password: string } | { kind: 'provider'; identity: ProviderIdentity };
export type ReauthResult = SignedIn | { status: 'wrong-credentials' } | Unreachable;
export type AccountDeletionResult = { status: 'deleted' } | { status: 'recent-sign-in-required' } | Unreachable;

export interface AuthBackend {
  restoreSession(): Promise<Session | null>;
  signUp(email: string, password: string): Promise<SignUpResult>;
  signInWithPassword(email: string, password: string): Promise<PasswordSignInResult>;
  submitSecondFactor(challengeId: string, code: string): Promise<SecondFactorResult>;
  signInWithProvider(identity: ProviderIdentity): Promise<ProviderSignInResult>;
  requestPasswordReset(email: string): Promise<PasswordResetResult>;
  reauthenticate(proof: ReauthProof): Promise<ReauthResult>;   // signed-in carries a fresh signedInAt
  deleteAccount(): Promise<AccountDeletionResult>;             // acts on the current session
  signOut(): Promise<void>;
}
```

- Also produces:
  - `storage.ts`: `export interface KeyValueStore { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void>; removeItem(k: string): Promise<void> }`, plus `createMemoryStore(): KeyValueStore`, `secureStore` (backed by expo-secure-store) and `asyncStorageStore` (backed by AsyncStorage).
  - `password-rules.ts`: `export const MIN_PASSWORD_LENGTH = 8`.
  - `demo-accounts.ts`: `export const DEMO_ACCOUNTS = { plain: { email: 'demo@example.com', password: 'Password123!' }, secondFactor: { email: 'demo-2fa@example.com', password: 'Password123!', code: '123456' } }`, `export type DemoAccounts = typeof DEMO_ACCOUNTS`.
  - `createFakeAuthBackend(options: { accounts: KeyValueStore; session: KeyValueStore; now?: () => number; delayMs?: number }): AuthBackend`. Defaults: `Date.now` and `0`. The same file exports `RECENT_SIGN_IN_WINDOW_MS = 5 * 60 * 1000`.

How the Fake behaves:
- **Emails** are trimmed and lowercased everywhere.
- **Storage:** Accounts are stored as JSON under `fake-auth.accounts`, and the session under `fake-auth.session`.
- **Demo Accounts** are added again at each start if they're missing.
- **Second Factor challenges** live in memory. A wrong code doesn't use up the challenge.
- **Google and Apple Accounts** are matched by `provider` + `subject`.

- [ ] **Step 1: Install storage.** Run `npx expo install expo-secure-store @react-native-async-storage/async-storage`.
- [ ] **Step 2: Write the failing tests.** Every test builds the backend with `createMemoryStore()` stores and a controllable `now`. A "restart" is a new `createFakeAuthBackend` call on the same stores.
  - **Demo Sign-in:** the plain demo Account signs in. The result is `signed-in` with `session.account` matching `{ email: 'demo@example.com', method: 'password' }` and `signedInAt === now()`.
  - **Wrong password and unknown email:** both give `{ status: 'wrong-credentials' }`.
  - **Email normalization:** `signInWithPassword('  Demo@Example.COM ', 'Password123!')` gives `signed-in` (Review Focus 1).
  - **Second Factor:** the 2FA demo Account gives `second-factor-required` with a `challengeId`. Submitting `'000000'` gives `wrong-code`, and then `'123456'` on the same `challengeId` gives `signed-in`.
  - **Sign-up:**
    - `signUp('new@example.com', 'abcdefgh')` gives `signed-in`.
    - `signUp('NEW@example.com', 'abcdefgh')` gives `email-in-use`.
    - `signUp('x@example.com', 'abcdefg')` (7 characters) gives `weak-password`.
  - **Sign-up survives restart:** after a restart, the new Account still signs in.
  - **Password Reset:** `requestPasswordReset` gives `{ status: 'sent' }` for `demo@example.com` and for `nobody@example.com`. Afterwards, the old demo password still signs in.
  - **Restoring the session:**
    - After Sign-in and a restart, `restoreSession()` returns an equal session with the same `signedInAt`.
    - After `signOut()`, it returns `null`.
  - **Recent Account Deletion:** `deleteAccount()` within 5 minutes gives `deleted`. Signing in again afterwards gives `wrong-credentials`, and `restoreSession()` gives `null`.
  - **Old Sign-in:** after advancing `now` by `RECENT_SIGN_IN_WINDOW_MS + 1`, `deleteAccount()` gives `recent-sign-in-required`.
    - `reauthenticate({ kind: 'password', password: 'wrong' })` gives `wrong-credentials`.
    - The right password gives `signed-in` with `signedInAt === now()`, and then `deleteAccount()` gives `deleted`.
  - **Old Sign-in across a restart** (Review Focus 4): sign in, advance `now` past the window, restart, `restoreSession()`, then `deleteAccount()`. The result is `recent-sign-in-required`.
  - **Google:** `signInWithProvider({ provider: 'google', subject: 'g-1', idToken: 't', email: 'g@example.com' })` gives `signed-in` with `method: 'google'`. A second Sign-in with the same subject gives the same `account.id`.
  - **Provider reauthentication:** for a Google Account, a provider proof with the same subject gives `signed-in`, and one with a different subject gives `wrong-credentials`.
  - **Demo Accounts return:** delete the plain demo Account, then restart. The demo Account signs in again.
- [ ] **Step 3: Run them and see them fail.** Run `npx jest src/auth/fake`. Expected: FAIL, because `createFakeAuthBackend` isn't defined.
- [ ] **Step 4: Implement** `types.ts`, `storage.ts`, `password-rules.ts`, `demo-accounts.ts` and `createFakeAuthBackend.ts`. Each method waits `delayMs` before it answers.
- [ ] **Step 5: Run them and see them pass.** Run `npx jest src/auth/fake`. Expected: PASS.
- [ ] **Step 6: Commit.** Message: `feat: add Auth Backend seam and Fake Auth Backend`.

### Task 4: AuthProvider, Sign-in Methods and native provider adapters

**Files:**
- Create: `src/auth/AuthProvider.tsx`, `src/auth/sign-in-methods.ts`, `src/auth/providers/google.ts`, `src/auth/providers/apple.ts`, `src/auth/backend.ts`, `src/test-utils/auth.ts`
- Test: `src/auth/AuthProvider.test.tsx`, `src/auth/sign-in-methods.test.ts`

**Interfaces:**
- Consumes: Task 3 types, `createFakeAuthBackend`, `DEMO_ACCOUNTS`; Task 1 config `extra`.
- Produces:
  - `export type ProviderSignIn = () => Promise<ProviderIdentity | null>`, where `null` means the person cancelled
  - `export type Cancelled = { status: 'cancelled' }`
  - `export type EnabledSignInMethods = { password: boolean; google: boolean; apple: boolean }`
  - `export type AuthState = { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; session: Session }`
  - `export function AuthProvider(props: { backend: AuthBackend; providers: Record<'google' | 'apple', ProviderSignIn>; signInMethods: EnabledSignInMethods; demoAccounts: DemoAccounts | null; children: ReactNode }): JSX.Element`
  - `export function useAuth()`. It returns `{ state, signInMethods, demoAccounts }` plus these actions:
    - `signUp(email, password): Promise<SignUpResult>`
    - `signInWithPassword(email, password): Promise<PasswordSignInResult>`
    - `submitSecondFactor(challengeId, code): Promise<SecondFactorResult>`
    - `signInWithProvider(p: 'google' | 'apple'): Promise<ProviderSignInResult | Cancelled>`
    - `requestPasswordReset(email): Promise<PasswordResetResult>`
    - `reauthenticate(proof: { kind: 'password'; password: string } | { kind: 'provider' }): Promise<ReauthResult | Cancelled>`
    - `deleteAccount(): Promise<AccountDeletionResult>`
    - `signOut(): Promise<void>`
  - `export function enabledSignInMethods(platform: string = Platform.OS, extra = Constants.expoConfig?.extra): EnabledSignInMethods`. Apple counts only on `'ios'`. Missing config gives `{ password: true, google: false, apple: false }`.
  - `signInWithGoogle: ProviderSignIn` and `signInWithApple: ProviderSignIn`
  - `backend.ts`:
    - `export const authBackend = createFakeAuthBackend({ accounts: asyncStorageStore, session: secureStore, delayMs: 400 })`
    - `export const demoAccounts: DemoAccounts | null = DEMO_ACCOUNTS`, with a comment saying to set it to `null` when a real Auth Backend is swapped in
  - Test utils:
    - `createTestBackend(options?: { now?: () => number }): AuthBackend`, a Fake on memory stores with `delayMs: 0`
    - `stubProviders(overrides?: Partial<Record<'google' | 'apple', ProviderSignIn>>)`, which defaults to resolving `null`

How AuthProvider behaves:
- **On mount** it calls `restoreSession()`. A session gives signed-in. `null` or a throw gives signed-out.
- **A thrown action** returns `{ status: 'unreachable' }` and leaves the state alone.
- **A `signed-in` result** sets the signed-in state.
- **A `deleted` result** sets signed-out.
- **`signOut`** sets signed-out even if the backend throws.
- **Provider reauthentication** calls `providers[session.account.method]()`.

- [ ] **Step 1: Install the native sign-in libraries.** Run `npx expo install expo-apple-authentication @react-native-google-signin/google-signin`.
- [ ] **Step 2: Write the failing tests.** Use `renderHook` with an `AuthProvider` wrapper.
  - **Restoring:** the state starts as `loading`. With no session it becomes `signed-out`. When `restoreSession` returns a session, it becomes `signed-in`. When `restoreSession` throws, it becomes `signed-out`.
  - **Password Sign-in:** the plain demo Account makes the state `signed-in`. The 2FA demo Account returns `second-factor-required`, and the state stays `signed-out`.
  - **Throws** (Review Focus 3): with `signInWithPassword` replaced by `jest.fn().mockRejectedValue(new Error('offline'))`, the result is `{ status: 'unreachable' }` and the state stays `signed-out`.
  - **Google:**
    - When the provider resolves `null`, the result is `{ status: 'cancelled' }`, and `backend.signInWithProvider` isn't called.
    - When it resolves an identity, the state is `signed-in` with `method: 'google'`.
  - **Deleting and signing out:** `deleteAccount` giving `deleted` sets the state to `signed-out`. `signOut` sets `signed-out` even when `backend.signOut` rejects.
  - **Provider reauthentication:** `reauthenticate({ kind: 'provider' })` for a Google session calls `providers.google` exactly once.
  - **Sign-in Methods:**
    - `enabledSignInMethods('android', { signInMethods: { password: true, google: true, apple: true } })` returns `{ password: true, google: true, apple: false }`.
    - The same config on `'ios'` returns Apple `true`.
    - `enabledSignInMethods('android', undefined)` returns the defaults.
- [ ] **Step 3: Run them and see them fail.** Run `npx jest src/auth/AuthProvider src/auth/sign-in-methods`. Expected: FAIL.
- [ ] **Step 4: Implement the modules.**
  - **`google.ts`** loads the library with a lazy `require` inside the function and configures it with `extra.googleWebClientId`. Cancelling resolves `null`; check the installed library's README for its current `signIn()` result shape.
  - **`apple.ts`** maps the `ERR_REQUEST_CANCELED` error to `null`.
  - **Both** return `{ provider, subject, idToken, email }`.
- [ ] **Step 5: Run them and see them pass.** Run the same command. Expected: PASS. Run `npm run typecheck`; there are no errors.
- [ ] **Step 6: Commit.** Message: `feat: add AuthProvider, Sign-in Methods and Google/Apple adapters`.

### Task 5: UI building blocks

**Files:**
- Create: `src/ui/AppText.tsx`, `src/ui/Button.tsx`, `src/ui/TextField.tsx`, `src/ui/FormMessage.tsx`, `src/ui/Screen.tsx`
- Test: `src/ui/Button.test.tsx`, `src/ui/TextField.test.tsx`

**Interfaces:**
- Consumes: `useTheme()` (Task 2).
- Produces:
  - `AppText(props: TextProps & { variant?: 'title' | 'heading' | 'body' | 'small'; tone?: 'default' | 'muted' | 'danger' | 'link' })`. The default is body/default.
  - `Button(props: { title: string; onPress: () => void | Promise<unknown>; variant?: 'primary' | 'secondary' | 'danger' | 'link'; disabled?: boolean; testID?: string })`. While a returned promise is pending, it ignores presses, shows a spinner and sets `accessibilityState.busy`. Its minimum height is `minTapTarget`, including the `link` variant, which renders as link-toned text with no background.
  - `TextField(props: TextInputProps & { label: string; error?: string | null; helperText?: string })`. It shows a visible label above the input, uses `accessibilityLabel={label}`, and shows the error (in the danger tone) or the helper text directly below the input. The input's minimum height is `minTapTarget`.
  - `FormMessage(props: { tone: 'info' | 'error'; children: string })`. It uses `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`.
  - `Screen(props: { children: ReactNode })`. It combines the safe area, keyboard avoidance and scrolling, with Theme background and `spacing.lg` padding.

- [ ] **Step 1: Read the UI rules.** Read `.claude/skills/ui-ux-pro-max/references/pro-rules.md` (native app rules: touch feedback, safe areas, dark mode contrast).
- [ ] **Step 2: Write the failing tests.**
  - **Double press** (Review Focus 2): with `onPress` returning a promise that hasn't resolved, pressing "Sign in" twice calls `onPress` exactly once, and the button reports busy. After the promise resolves, a press calls it again.
  - **Disabled:** when `disabled`, pressing it never calls `onPress`.
  - **TextField:**
    - `getByLabelText('Email')` finds the input, and the text "Email" is visible.
    - With `error="Enter your email."`, that text is shown.
    - With `error={null}` and `helperText="At least 8 characters"`, the helper text is shown and no error is.
- [ ] **Step 3: Run them and see them fail.** Run `npx jest src/ui`. Expected: FAIL.
- [ ] **Step 4: Implement the five components**, using only Theme values.
- [ ] **Step 5: Run them and see them pass.** Run `npx jest src/ui src/theme`. Expected: PASS, including the raw-style-values test.
- [ ] **Step 6: Commit.** Message: `feat: add Theme-based UI building blocks`.

### Task 6: Navigation, Sign-in, Second Factor and Home

**Files:**
- Create: `src/navigation/RootNavigator.tsx`, `src/auth/messages.ts`, `src/auth/validation.ts`, `src/features/auth/ProviderButtons.tsx`, `src/features/auth/DemoAccountsHint.tsx`, `src/test-utils/renderApp.tsx`
- Replace: `app/_layout.tsx`, `app/index.tsx` (delete; Home moves to `app/(app)/index.tsx`)
- Create: `app/(auth)/_layout.tsx`, `app/(auth)/sign-in.tsx`, `app/(auth)/second-factor.tsx`, `app/(app)/_layout.tsx`, `app/(app)/index.tsx`
- Test: `tests/flows/sign-in.test.tsx`, `src/auth/validation.test.ts`

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces:
  - `RootNavigator(): JSX.Element | null`. It renders `null` while auth is loading. Otherwise it renders a `Stack` with `Stack.Protected guard={signedIn}` around `(app)`, and `Stack.Protected guard={!signedIn}` around `(auth)`.
  - `validateEmail(raw: string): string | null` and `validateRequired(raw: string, message: string): string | null`
  - `MESSAGES` in `src/auth/messages.ts`. This exact copy is used by every later task:
    - `unreachable`: "We couldn't reach the server. Check your connection and try again."
    - `wrongCredentials`: "That email and password don't match. Try again."
    - `wrongCode`: "That code isn't right. Check it and try again."
    - `emailRequired`: "Enter your email."
    - `emailInvalid`: "Enter a valid email address."
    - `passwordRequired`: "Enter your password."
    - `codeRequired`: "Enter the 6-digit code."
    - `emailInUse`: "An account with that email already exists. Try signing in."
    - `weakPassword`: "Use at least 8 characters." (built from `MIN_PASSWORD_LENGTH`)
    - `confirmationRequired`: "Check your email to confirm your account, then sign in."
    - `resetSent`: "If an account exists for that email, we've sent a link to reset your password."
    - `deleteConfirm`: "Delete your account? This can't be undone."
    - `recentSignInRequired`: "For your security, sign in again to delete your account."
  - `renderApp(options?: { backend?: AuthBackend; providers?: Partial<Record<'google' | 'apple', ProviderSignIn>>; signInMethods?: Partial<EnabledSignInMethods>; demoAccounts?: DemoAccounts | null; initialUrl?: string })` returns `{ backend, ...renderRouterResult }`. It calls `renderRouter` from `expo-router/testing-library` with a route map of the real `app/` screens. The root `_layout` in that map wraps `RootNavigator` in a `ThemeProvider` and an `AuthProvider` built from the options (defaults: `createTestBackend()`, `stubProviders()`, password only, `DEMO_ACCOUNTS`). Every later flow test uses it.

How the screens work:
- **`app/_layout.tsx`** keeps the splash screen up until `useFonts(fontAssets)` has loaded and auth is no longer `loading`. It renders `ThemeProvider`, then `AuthProvider` with `authBackend`, `{ google: signInWithGoogle, apple: signInWithApple }`, `enabledSignInMethods()` and `demoAccounts`, then `RootNavigator`.
- **Sign-in** has Email and Password fields, a "Sign in" button and `ProviderButtons` ("Continue with Google" and "Continue with Apple", only for enabled methods). It also has two `variant="link"` Buttons, "Create an account" (to `/sign-up`) and "Forgot password?" (to `/password-reset`), plus `DemoAccountsHint` when `demoAccounts` isn't `null`.
  - Empty or invalid fields show their errors next to the field, and the backend isn't called.
  - `second-factor-required` pushes `/second-factor?challengeId=…`.
- **Second Factor** has a "Code" field with a number pad and `autoComplete="one-time-code"`, plus a "Verify" button.
- **Home** shows the title "Home", "Signed in as {email}" and "This is where your app starts."
- **The `(app)` layout** is `Tabs` with Home only; Task 8 adds the Account tab.

- [ ] **Step 1: Write the failing tests.** In `validation.test.ts`:
  - `validateEmail('')` returns `MESSAGES.emailRequired`.
  - `validateEmail('demo')` returns `MESSAGES.emailInvalid`.
  - `validateEmail(' demo@example.com ')` returns `null`.

  In `sign-in.test.tsx`, each case uses `renderApp`:
  - **Signed out:** the app opens on `/sign-in`, and the text `demo@example.com` (from the demo hint) is visible.
  - **Empty fields:** pressing "Sign in" with both fields empty shows "Enter your email." and "Enter your password." A spy on `backend.signInWithPassword` has 0 calls.
  - **Demo Account:** signing in with it ends at pathname `/` and shows "Signed in as demo@example.com".
  - **Wrong password:** it shows `MESSAGES.wrongCredentials`, and the Email field still holds what was typed.
  - **Second Factor:** the 2FA demo Account ends at pathname `/second-factor`. Code `000000` shows `MESSAGES.wrongCode`, and then `123456` ends at `/` (Home).
  - **Unreachable** (Review Focus 3): with `backend.signInWithPassword` rejecting, it shows `MESSAGES.unreachable`.
  - **Double tap** (Review Focus 2): pressing "Sign in" twice quickly calls `backend.signInWithPassword` once.
  - **Restart:** sign in through `backend` directly, then `renderApp({ backend })`. Home shows without going through the sign-in screen.
  - **Google hidden by default:** "Continue with Google" isn't rendered.
  - **Google switched on:**
    - When the provider resolves an identity, it ends on Home.
    - When the provider resolves `null`, it stays on `/sign-in` with no error message.
- [ ] **Step 2: Run them and see them fail.** Run `npx jest tests/flows/sign-in src/auth/validation`. Expected: FAIL.
- [ ] **Step 3: Implement the routes, navigator, messages, validation and components** listed above.
- [ ] **Step 4: Run all tests and see them pass.** Run `npm test`. Expected: PASS, including the raw-style-values test.
- [ ] **Step 5: Commit.** Message: `feat: add Sign-in, Second Factor and Home with protected navigation`.

### Task 7: Sign-up and Password Reset

**Files:**
- Create: `app/(auth)/sign-up.tsx`, `app/(auth)/password-reset.tsx`
- Test: `tests/flows/sign-up.test.tsx`, `tests/flows/password-reset.test.tsx`

**Interfaces:**
- Consumes: `renderApp`, `MESSAGES`, `validateEmail`, `MIN_PASSWORD_LENGTH`, UI building blocks.

How the screens work:
- **Sign-up** has Email and Password fields, with the Password helper text "At least 8 characters".
  - The client checks only that the email is valid and the password isn't empty; the Auth Backend decides whether a password is too weak.
  - A `confirmation-required` result shows `MESSAGES.confirmationRequired` with a "Back to sign in" button.
- **Password Reset** has an Email field and a "Send reset link" button, then shows `MESSAGES.resetSent` and a "Back to sign in" button.

- [ ] **Step 1: Write the failing tests.**
  - **New Account:** Sign-up with `new@example.com` / `abcdefgh` ends at `/` showing "Signed in as new@example.com".
  - **Email in use:** Sign-up with `Demo@Example.com` shows `MESSAGES.emailInUse` next to Email.
  - **Weak password:** Sign-up with `abcdefg` shows `MESSAGES.weakPassword` next to Password.
  - **Confirmation required:** with `backend.signUp` resolving `{ status: 'confirmation-required' }`, it shows `MESSAGES.confirmationRequired`, and the pathname stays `/sign-up`.
  - **Password Reset copy:** Password Reset for `demo@example.com` and for `nobody@example.com` shows exactly `MESSAGES.resetSent` in both cases.
  - **Empty email:** shows `MESSAGES.emailRequired`, and a spy on `backend.requestPasswordReset` has 0 calls.
  - **Navigation:** "Back to sign in" ends at `/sign-in`. From Sign-in, "Create an account" ends at `/sign-up`, and "Forgot password?" ends at `/password-reset`.
- [ ] **Step 2: Run them and see them fail.** Run `npx jest tests/flows/sign-up tests/flows/password-reset`. Expected: FAIL.
- [ ] **Step 3: Implement both screens.**
- [ ] **Step 4: Run all tests and see them pass.** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: add Sign-up and Password Reset`.

### Task 8: Account Screen, Sign-out and Account Deletion

**Files:**
- Create: `app/(app)/account.tsx`, `src/features/account/ReauthPrompt.tsx`
- Modify: `app/(app)/_layout.tsx` (add the Account tab)
- Test: `tests/flows/account.test.tsx`

**Interfaces:**
- Consumes: `useAuth()` (`deleteAccount`, `reauthenticate`, `signOut`), `renderApp`, `MESSAGES`.
- Produces: `ReauthPrompt(props: { method: SignInMethod; onConfirmed: () => void })`. It shows a Password field and a "Confirm" button for password Accounts, or a "Continue with Google"/"Continue with Apple" button for provider Accounts.

How the screen works:
- **Account Screen** shows "Signed in as {email}", plus "Sign out" and "Delete account" buttons.
- **"Delete account"** shows an in-screen confirmation with `MESSAGES.deleteConfirm`, a "Delete account" danger button and "Cancel". It doesn't use `Alert`.
- **`recent-sign-in-required`** shows `MESSAGES.recentSignInRequired` and the `ReauthPrompt`. On confirmation it calls `deleteAccount()` again.

- [ ] **Step 1: Write the failing tests.** Each starts signed in as the demo Account and navigates to `/account`.
  - **Account shown:** "Signed in as demo@example.com" is visible, and there are tab buttons for Home and Account.
  - **Sign-out:** "Sign out" ends at `/sign-in`. `renderApp({ backend })` again (a restart) still opens on `/sign-in`.
  - **Cancel:** "Delete account" then "Cancel" deletes nothing; the demo Account still signs in through `backend`.
  - **Recent deletion:** "Delete account" then confirming ends at `/sign-in`. A new Sign-up with `demo@example.com` now succeeds, which proves the Account is gone.
  - **Old Sign-in:** with a test backend whose `now` is advanced by `RECENT_SIGN_IN_WINDOW_MS + 1` after Sign-in, confirming deletion shows `MESSAGES.recentSignInRequired` and a Password field.
    - The wrong password shows `MESSAGES.wrongCredentials`.
    - `Password123!` ends at `/sign-in`.
  - **Google Account:** signed in through Google, with the window passed, the prompt shows "Continue with Google" and no Password field.
  - **Unreachable:** with `backend.deleteAccount` rejecting, it shows `MESSAGES.unreachable`, and the pathname stays `/account`.
- [ ] **Step 2: Run them and see them fail.** Run `npx jest tests/flows/account`. Expected: FAIL.
- [ ] **Step 3: Implement the Account Screen, the Account tab and `ReauthPrompt`.**
- [ ] **Step 4: Run all tests and see them pass.** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: add Account Screen with Sign-out and Account Deletion`.

### Task 9: new-app command

**Files:**
- Create: `scripts/new-app.js` (CommonJS, Node built-ins only)
- Modify: `package.json` (add the script `"new-app": "node scripts/new-app.js"`)
- Test: `scripts/new-app.test.js` (`@jest-environment node`)

**Interfaces:**
- Consumes: `app-identity.json` (Task 1).
- Produces:
  - `deriveIdentity({ name, id, slug? }): { name, slug, scheme, iosBundleId, androidPackage }`
    - The slug is the name lowercased, with each run of non-`[a-z0-9]` characters turned into `-` and the ends trimmed.
    - The scheme is the slug with the dashes removed.
    - Both IDs are `id`.
    - It throws when the id fails `/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/`. The message is: "Identifier must look like com.yourname.app: at least two parts separated by dots, each starting with a letter and using only letters, numbers and underscores."
    - It throws when the slug comes out empty. The message is: "Couldn't make a slug from that name; pass --slug."
  - `findStarterIdentity(dir: string, identity: AppIdentity): string[]` returns the relative paths of text files containing any value of `identity`. It skips `.git/`, `node_modules/` and `.claude/`.
  - `createDerivedApp({ sourceDir, targetDir, name, id, slug?, git = true }): { targetDir, identity, todos: string[] }`
  - CLI: `npm run new-app -- --name "FitTrack" --id com.yourname.fittrack [--slug fittrack] [--dir ../fittrack]`. The default `--dir` is `<sourceDir>/../<slug>`. It prints the target, the App Identity and the to-do list, and exits with 1 and the error message on failure.

What `createDerivedApp` does, in order:
1. Validate everything first, before writing anything:
   - `deriveIdentity`
   - the target doesn't exist or is empty, otherwise throw `"<targetDir> already exists and isn't empty."`
   - when `git` is true, `git --version` runs
2. Copy everything with `fs.cpSync`, except `.git`, `node_modules`, `ios`, `android`, `.expo`, `dist`, `coverage`, `.scratch`, `docs/superpowers` (the Starter's own plans), `.env*.local`, `scripts/new-app.js`, `scripts/new-app.test.js` and `scripts/new-app.e2e.test.js`.
3. Write the new `app-identity.json`.
4. Set `name` to the slug in `package.json` and in `package-lock.json` (both the root `name` and `packages[""].name`). Remove the `new-app` and `test:new-app` scripts.
5. Replace the first line of `GLOSSARY.md` with `# <name>`. Write a new `README.md`: `# <name>`, how to run it, and a pointer to `docs/adr/` and `GLOSSARY.md`.
6. Throw if `findStarterIdentity(target, starterIdentity)` isn't empty. The message lists the files.
7. When `git` is true, run `git init`, `git add -A` and `git commit -m "chore: create <name> from the Starter"`.
8. Return the to-dos: replace `assets/images/icon.png` (and the other template images), extract the Theme from a Reference Design, and switch on Google or Apple in `app.config.ts` if needed.

- [ ] **Step 1: Write the failing tests.** Use temporary folders from `fs.mkdtempSync(os.tmpdir())`, and set `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME` and `GIT_COMMITTER_EMAIL` for the commit.
  - **Single-word name:** `deriveIdentity({ name: 'FitTrack', id: 'com.yourname.fittrack' })` equals `{ name: 'FitTrack', slug: 'fittrack', scheme: 'fittrack', iosBundleId: 'com.yourname.fittrack', androidPackage: 'com.yourname.fittrack' }`.
  - **Name with spaces:** the name `'My Fit App'` gives slug `my-fit-app` and scheme `myfitapp`.
  - **Bad identifiers** (Review Focus 5): `'com.my-company.app'`, `'fittrack'` and `'com.1abc.app'` each throw `/at least two parts/`.
  - **No usable slug:** the name `'日本'` with no slug throws `/--slug/`, and with `slug: 'nihon'` it succeeds.
  - **Sanity check:** `findStarterIdentity(repoRoot, starterIdentity)` includes `'app-identity.json'`, which proves the check finds something.
  - **Creating a copy:** `createDerivedApp` from the repo root into an empty temp folder produces:
    - an `app-identity.json` equal to the derived identity
    - `package.json` with `name` `'fittrack'` and no `new-app` script
    - no `scripts/new-app.js`, `.scratch` or `node_modules`
    - `README.md` and `GLOSSARY.md` both starting with `# FitTrack`
    - `findStarterIdentity(target, starterIdentity)` equal to `[]`
    - `git rev-list --count HEAD` equal to `1`
  - **Existing folder** (Review Focus 5): with a target that already holds `keep.txt`, it throws `/already exists/`, and the folder still holds only `keep.txt`.
- [ ] **Step 2: Run them and see them fail.** Run `npx jest scripts/new-app.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement `scripts/new-app.js`.** Use `path` for every path so it works on Windows, macOS and Linux. Export the three functions; the CLI runs under `require.main === module`.
- [ ] **Step 4: Run all tests and see them pass.** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat: add new-app command for creating Derived Apps`.

### Task 10: Derived App end-to-end test, docs and Android hand-check

**Files:**
- Create: `scripts/new-app.e2e.test.js`, `README.md`, `docs/hand-check.md`
- Modify: `package.json` (add the script `"test:new-app"`), `jest.config.js` (keep `\.e2e\.test\.js$` out of `npm test`)

**Interfaces:**
- Consumes: `createDerivedApp` (Task 9).

- [ ] **Step 1: Write the end-to-end test.**
  - It creates `FitTrack` / `com.yourname.fittrack` in a temp folder.
  - It runs `npm ci --no-audit --no-fund --prefer-offline` there, then `npx jest --ci` there. Both must exit with 0.
  - It has a 15-minute timeout.
  - The script is `"test:new-app": "jest --testPathIgnorePatterns=[] --testMatch=**/scripts/new-app.e2e.test.js"`.
- [ ] **Step 2: Run it.** Run `npm run test:new-app`. Expected: PASS. If it fails, fix the command in `scripts/new-app.js`, not the test.
- [ ] **Step 3: Write `README.md`.** Sections:
  - What the Starter is (two sentences, glossary terms)
  - Windows setup (from the spec's Developer setup section)
  - Running on Android: `npx expo run:android`
  - Demo Accounts (both, with the code `123456`)
  - Creating a Derived App with `npm run new-app`
  - Switching on Google or Apple (`signInMethods` in `app.config.ts`; `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `GOOGLE_IOS_URL_SCHEME` in `.env.local`; the App Store 4.8 note)
  - Swapping in a real Auth Backend: implement `AuthBackend` from `src/auth/types.ts`, wire it in `src/auth/backend.ts` and set `demoAccounts` to `null`
  - Applying a Reference Design: edit `src/theme/theme.ts` and `src/theme/fonts.ts` only
  - Known unproven areas (copied from the spec)
  - Tests: `npm test` and `npm run test:new-app`
- [ ] **Step 4: Write `docs/hand-check.md`.** It's a checklist covering every flow in the spec's Definition of done, run once in light and once in dark. Each item is phrased as an action plus what you should see. For example: "Sign in as demo-2fa@example.com → code screen; enter 000000 → 'That code isn't right…' under the field." Refer to "the app", never the App Identity values: this file is copied into Derived Apps, and the identity check would flag them.
- [ ] **Step 5: Android setup (the user does this).** Install Android Studio with the Android SDK and an emulator. Set `ANDROID_HOME` and add `platform-tools` to `PATH`, then confirm `adb --version` prints a version. JDK 17 is already installed.
- [ ] **Step 6: Run the hand-check.** Run `npx expo run:android`, then work through `docs/hand-check.md` in light mode and dark mode. Tick each item in the file, and log any failure as `.scratch/mobile-app-starter/issues/NN-<slug>.md`.
- [ ] **Step 7: Final verification.** Run `npm test`, `npm run typecheck`, `npm run test:new-app` and `npx expo-doctor`. All of them pass. Paste their summaries into the commit body.
- [ ] **Step 8: Commit.** Message: `docs: add README, hand-check checklist and Derived App end-to-end test`.
