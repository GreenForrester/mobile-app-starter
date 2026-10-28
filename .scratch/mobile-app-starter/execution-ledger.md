# SDD ledger — plan: docs/superpowers/plans/2026-10-27-mobile-app-starter.md
Setup: Ruling: no git worktree; baseline docs commit on main, then branch feat/mobile-app-starter in place — the repo had no commits (a worktree needs one) and a nested .worktrees/ path raises Windows path-length failures in Android native builds — cost if wrong: none to main beyond the docs baseline.
Task 1: Ruling: existing docs were committed in the baseline commit, not in Task 1's commit — the baseline was needed to branch from — cost if wrong: none.
Pre-flight: T1→T4 config extra {signInMethods, googleWebClientId} matches enabledSignInMethods/google.ts; T1→T9 app-identity.json shape matches; T2→T5/T6 useTheme/fontAssets match; T3→T4/T8 types, DEMO_ACCOUNTS, RECENT_SIGN_IN_WINDOW_MS (createFakeAuthBackend.ts) match; T4→T6-8 AuthProvider/useAuth/createTestBackend/stubProviders match; T5→T6-8 Button (incl. link variant)/TextField match; T6→T7/T8 renderApp/MESSAGES/validateEmail match; T9→T10 createDerivedApp matches. No conflicts.
Task 1: Ruling: scaffolded into starter-tmp, not .starter-tmp — npm package names can't start with a dot — cost if wrong: none.
Task 1: Ruling: installed expo-secure-store in Task 1 instead of Task 3 — Step 5 lists its config plugin, which must resolve for `expo config`/doctor — cost if wrong: none.
Task 1: Ruling: added react-dom@19.3.0 — expo-router's web dependencies pulled react-dom@19.3.1, whose peer react@^19.3.1 conflicts with the SDK's react@19.3.0 and broke the dev-dependency install — cost if wrong: an unused web dependency.
Task 1: Ruling: tsconfig sets "types": ["jest", "node"] and restates Expo's excludes plus .claude/.superpowers — TypeScript 6 no longer auto-includes @types packages, and a local exclude replaces the base list — cost if wrong: none.
Task 1: Ruling: npm scripts android/ios run `expo run:*` (development build) and the template's web script is dropped — the spec runs the app as a development build; web isn't a target — cost if wrong: a developer wanting web adds the script back.
Task 1: Ruling: template icons live at assets/icon.png (not assets/images/) — Task 9's to-do list must name assets/icon.png and the android-icon-*.png files — cost if wrong: a wrong path in a printed to-do.
Task 1: Ruling: splash background uses the Theme backgrounds (#F8FAFC light, #020617 dark) in app.config.ts — matches Task 2's table so launch has no flash of a different color — cost if wrong: none.
Task 1: complete (commits 59e8dde..dad759e, tests: npm test → Ran all test suites.)
Task 2: Ruling: the raw-style scanner lives in src/test-utils/raw-style-values.ts with its own tests on sample lines — against today's near-empty app/ the repo-wide check would pass before any code existed, proving nothing — cost if wrong: none.
Task 2: Ruling: Theme textSizes/spacing/radius/minTapTarget are typed `number`, not the literal values — literal types would force a type edit every time a Derived App applies a Reference Design — cost if wrong: none.
Task 2: Ruling: installed expo-asset and added the 'expo-font' config plugin — expo-asset is expo-font's peer (Jest couldn't resolve it) and `expo install` asked for the plugin but can't edit a dynamic config — cost if wrong: none.
Task 2: Ruling: @testing-library/react-native v14 makes render, renderHook, fireEvent and act return Promises — every later test awaits them — cost if wrong: none; plan snippets written without await are adjusted in place.
Task 2: complete (commits dad759e..54e1274, tests: npm test → Ran all test suites.)
Task 3: Ruling: SecureStore/AsyncStorage adapters live in src/auth/device-storage.ts; storage.ts holds only KeyValueStore and createMemoryStore — keeps native modules out of the Fake's tests; Task 4's backend.ts imports secureStore/asyncStorageStore from device-storage — cost if wrong: none.
Task 3: Ruling: a Google/Apple identity with no email gets "<provider>-<subject>@example.com" — Account.email is a string and Apple only sends the email on first Sign-in — cost if wrong: an odd email on the Account Screen for that case in the Fake only.
Task 3: Ruling: deleteAccount() with no current session returns recent-sign-in-required — the seam has no "signed out" outcome and the screen can only call it while signed in — cost if wrong: none.
Task 3: complete (commits 54e1274..0a8d99e, tests: npm test → Ran all test suites.)
Task 4: Ruling: the "no config" Sign-in Methods test passes null instead of undefined — a JS default parameter replaces an explicit undefined with the real Expo config, so undefined couldn't test the fallback — cost if wrong: none.
Task 4: Ruling: EnabledSignInMethods is defined in sign-in-methods.ts and re-exported from AuthProvider.tsx — both modules need it and sign-in-methods must not import the provider — cost if wrong: none.
Task 4: Ruling: a provider sheet that throws (e.g. Play services missing) maps to unreachable, like a backend throw — the seam has no other error outcome for screens — cost if wrong: the person sees the connection message for a device problem.
Task 4: Ruling: google.ts follows the installed v16 API (signIn() returns {type:'success'|'cancelled'}; isSuccessResponse), with the user id as subject — checked in node_modules types — cost if wrong: none.
Task 4: complete (commits 0a8d99e..4f0b58d, tests: npm test → Ran all test suites.)
Task 5: Ruling: Theme minTapTarget is 48 on Android and 44 elsewhere, and the Theme test asserts >= 44 — pro-rules require 48dp on Android, the verified platform — cost if wrong: slightly taller controls on Android.
Task 5: Ruling: text inputs and secondary buttons use textMuted for their border, not the border token — pro-rules require 3:1 for control boundaries and border (#E2E8F0 on white) is about 1.2:1; border stays for dividers — cost if wrong: none.
Task 5: Ruling: Button's Pressable onPress starts the action and returns void — RNTL v14's fireEvent awaits a returned promise (which hung the test), and native ignores it anyway; double-press guard mutation-checked (fails with the guard removed) — cost if wrong: none.
Task 5: Ruling: title/heading AppText sets accessibilityRole="header" — screen readers announce headings; not in the plan — cost if wrong: none.
Task 5: complete (commits 4f0b58d..d865256, tests: npm test → Ran all test suites.)
Task 6: Ruling: renderApp calls renderRouter({ appDir: 'app', overrides: { _layout: TestRootLayout } }) instead of a hand-built route map — the installed expo-router supports overrides on the real app directory, so tests exercise the real route files — cost if wrong: none.
Task 6: Ruling: RootNavigator's Stack.Protected sets redirectTo="/sign-in" and redirectTo="/" — the default redirect is the root navigator's anchor, which doesn't exist, so a signed-out launch at "/" showed "Unmatched Route" (this would have hit real devices) — cost if wrong: none.
Task 6: Ruling: (auth) layout uses unstable_settings.anchor = 'sign-in' — initialRouteName is deprecated in this expo-router and logs a warning — cost if wrong: none.
Task 6: Ruling: jest.setup.ts mocks expo-font as already loaded — fonts can't load under Jest (no asset registry), which crashed Ionicons in the tab bar — cost if wrong: font-loading bugs aren't caught by tests (the Android hand-check covers them).
Task 6: Ruling: tab icons use @expo/vector-icons Ionicons (installed), colored from the Theme directly — pro-rules forbid emoji icons; the tabBarIcon color type (ColorValue incl. number/null) doesn't fit Ionicons — cost if wrong: none.
Task 6: Ruling: Apple uses AppleAuthenticationButton; Google uses a Theme-styled secondary Button "Continue with Google" — Apple requires its own button; Google's branded button would load the native module eagerly. README (Task 10) tells Derived Apps to check Google's branding rules — cost if wrong: a Derived App restyles one button.
Task 6: Ruling: wrong-credentials and unreachable show as a FormMessage above the fields (they concern the whole form); empty/invalid fields and a wrong Second Factor code show next to their field — matches "errors next to the field they belong to" — cost if wrong: none.
Task 6: Ruling: added "Sign in to continue." copy, native header titles for signed-out screens, and a "Back to sign in" link on Second Factor (a stale or missing challenge would otherwise strand the person) — not in the plan — cost if wrong: none.
Task 6: Ruling: verified the real app/_layout.tsx by bundling with `expo export --platform android` (exit 0) — it isn't covered by Jest — cost if wrong: none.
Task 6: complete (commits d865256..3a7c7cf, tests: npm test → Ran all test suites.)
Task 7: Ruling: "next to the field" is asserted as the error being that input's accessibilityHint (TextField sets it) plus the visible text — ties the error to its field instead of just finding text anywhere — cost if wrong: none.
Task 7: Ruling: the Sign-up submit button says "Create account" (the Sign-in link stays "Create an account"), and both screens keep a "Back to sign in" link (back, or replace to /sign-in when there's no history, e.g. a deep link) — cost if wrong: none.
Task 7: complete (commits 3a7c7cf..9374052, tests: npm test → Ran all test suites.)
Task 8: Ruling: tab buttons are queried as role "button" named "<Name>, tab, i of n" — that's what the installed bottom-tabs renders (the tab bar itself is role "tablist") — cost if wrong: none.
Task 8: Ruling: the first "Delete account" button is secondary and hides while the confirmation panel (with the danger "Delete account" and "Cancel") is shown; the re-sign-in panel also has Cancel — one destructive button on screen at a time — cost if wrong: none.
Task 8: Ruling: ReauthPrompt's onConfirmed returns a Promise (so Confirm stays busy through the deletion), and Apple re-sign-in uses AppleAuthenticationButton like Sign-in — cost if wrong: none.
Task 8: Ruling: RNTL v14 unmount() is async; tests await it — an un-awaited unmount left overlapping act() scopes that broke every later test in the file — cost if wrong: none.
Task 8: complete (commits 9374052..788f42d, tests: npm test → Ran all test suites.)
Task 9: Ruling: the copy also excludes .superpowers/ — this run's git-ignored execution workspace lives in the working tree and fs.cpSync doesn't read .gitignore — cost if wrong: none.
Task 9: Ruling: beyond the plan, the command refuses a missing --name, a --slug that isn't lowercase-and-dashes, and a target inside the Starter (fs.cpSync can't copy into itself), and supports --help — each is checked before anything is written — cost if wrong: none.
Task 9: Ruling: binary files are skipped by the identity check when a NUL byte appears in their first 8 KB — simpler and safer than an extension list — cost if wrong: a binary without NUL bytes gets scanned as text (harmless).
Task 9: Ruling: the to-do list names assets/icon.png, splash-icon.png, favicon.png and android-icon-*.png (the template's real paths, per the Task 1 ruling) and adds "npm install" and "plug in your Auth Backend" — cost if wrong: none.
Task 9: Ruling: verified the CLI by hand — success printed the identity and to-dos (exit 0, one commit in the copy); a bad id printed the message and usage (exit 1) and wrote nothing — the CLI wrapper isn't covered by Jest — cost if wrong: none.
Task 9: complete (commits 788f42d..c0940ff, tests: npm test → Ran all test suites.)
Task 10: Ruling: test:new-app overrides the ignore list with --testPathIgnorePatterns=/node_modules/ instead of `=[]` — Jest would read "[]" as an (invalid) regex — cost if wrong: none.
Task 10: Ruling: README adds Google branding and "verify the ID token" notes and a where-things-live table; hand-check adds double-tap, keyboard, safe-area and largest-font checks from pro-rules — cost if wrong: none.
Task 10: partial (commit after c0940ff) — README, hand-check, e2e test written and committed; npm test 103/103, typecheck clean, expo-doctor 20/20. NOT complete: `npm run test:new-app` was stopped by Claude Code for low system memory (no result), and the Android hand-check (Steps 5–6) waits on the user installing Android Studio.
Final review: fresh reviewer (opus), range 59e8dde..5c67654 — verdict "With fixes"; 0 Critical, 8 Important, 13 Minor. Fix pass: Important 1–8 plus re-graded expo-system-ui.
Final: Ruling: expo-system-ui re-graded Minor→Important — without it Android ignores userInterfaceStyle, so the spec's "follows the phone's light or dark setting" may fail on the verified platform — cost if wrong: one small dependency.
Final: minor (deferred): tests/flows/sign-in.test.tsx "no alert on Google cancel" can't fail — FormMessage's View isn't `accessible`, so role queries never match it.
Final: minor (deferred): the `password` Sign-in Method switch is computed but the sign-in screen always shows the password form.
Final: minor (deferred): new-app leaves a half-made folder on a late failure, and doesn't pre-check git user.name/email (git var GIT_COMMITTER_IDENT).
Final: minor (deferred): new-app copies git-ignored files from the working tree (e.g. *.jks, *.p8, *.key); copying `git ls-files -co --exclude-standard` would be the root fix.
Final: minor (deferred): a restoreSession that throws synchronously crashes launch; one that never resolves leaves the splash up forever (no timeout).
Final: minor (deferred): field errors are only an accessibilityHint, so screen readers don't announce them when they appear.
Final: minor (deferred): README overstates the raw-style test — it misses named colors, lineHeight, height and width.
Final: minor (deferred): GLOSSARY.md line 3 in a Derived App still describes the Starter.
Final: minor (deferred): ProviderIdentity has no Apple nonce/authorizationCode (Firebase Apple, App Store token revocation), and the seam has no auth-state subscription for background sign-outs.
Final: minor (deferred): "unreachable" is flow-tested only for Sign-in and Deletion; hand-check lacks a keyboard-submit step and a "wait 5 min, kill, reopen, delete" step.
Final: Ruling: declined "account linking across methods" — stands: spec puts linking out of scope — cost if wrong: duplicate Accounts for one email in a Derived App until it adds linking.
Final: Ruling: declined "Google/Apple never ask for a Second Factor" — stands: the spec states it — cost if wrong: none.
Final: Ruling: declined "Fake stores Sign-up passwords in plain text in AsyncStorage" — stands: on-device stand-in with demo data, never a real credential store — cost if wrong: a developer typing a real password into the Fake on their own phone.
Final: Ruling: declined "Fake has no lockout/expiry/rate limits" — stands: the seam now has a rate-limited outcome (fix 4); the Fake needn't produce it — cost if wrong: none.
Final: Ruling: declined ".claude/**/__pycache__/*.pyc with absolute paths copied into Derived Apps" — stands for now: harmless bytecode from the baseline commit; noted for the user — cost if wrong: clutter in copies.
Final: Ruling: declined ".env.local unavailable to cloud/EAS builds" — stands: CI and publishing are out of scope — cost if wrong: a Derived App sets EAS env vars when it first builds in the cloud.
Final: Ruling: declined "no guard against shipping the Fake in a release build" — stands: plan decision; README/guide tell Derived Apps to plug in a real backend and null demoAccounts — cost if wrong: a Derived App ships demo sign-in.
Final: Ruling: declined iOS runtime behaviors, Supabase delete function, SecureStore size limits, web target, supportsTablet, case-insensitive inside-Starter check, DoD "starter" wording — stand: unproven iOS area / out of scope / template defaults / settled by spec — cost if wrong: small.
Final: fixed Important 1 (keyboard submit bypassed the double-submit guard) — "sends one request when the keyboard submits and Sign in is tapped too" + password-reset twin RED→GREEN, suite 122/122
Final: fixed Important 2 (emails/codes trimmed only in the Fake) — "trims emails and codes before calling the backend" RED→GREEN, suite 122/122
Final: fixed Important 3 (new-app accepted ids Expo rejects) — underscore, reserved-word and digit-first-slug cases RED→GREEN, suite 122/122
Final: fixed Important 4 (seam missing Firebase/Supabase outcomes) — Fake "asks the 2FA Account for its code again before deleting", flows "confirmation-required at Sign-in", "rate-limited", "2FA code again before deleting" RED→GREEN, suite 122/122
Final: fixed Important 5 (Google: no iOS client ID, Android-only blocked, never signed out of Google) — config "Android only"/"derives the iOS client ID" and AuthProvider "signs out of Google" ×2 RED→GREEN, suite 122/122
Final: fixed Important 6 (errors swallowed without a log) — "logs what the backend threw, in development" RED→GREEN, suite 122/122
Final: fixed Important 7 (no protected place for pushed screens) — screens.test "keeps a screen added under (app) out of reach while signed out" + "opens it while signed in" RED→GREEN, suite 122/122
Final: fixed Important 8 (Derived Apps got a stub README with broken pointers) — new-app "README points to docs/building-on-the-starter.md" RED→GREEN, suite 122/122
Final: fixed re-graded expo-system-ui — "installs expo-system-ui so Android follows the light or dark setting" RED→GREEN, suite 122/122
Final: Ruling: Google's iOS URL scheme is optional and only adds the plugin when present (its plugin throws without it and only edits the iOS Info.plist) — Android-only apps need just the Web client ID — cost if wrong: an iOS build with Google on but no scheme fails at sign-in with the dev log explaining why.
Final: Ruling: ProviderSignIn stays a callable with an optional signOut property, instead of an adapter object — keeps every existing provider stub and call site unchanged — cost if wrong: none.
Final: Ruling: did not re-run `expo export` after the fix pass — the machine is short on memory; the route change is covered by flow tests against the real app/ directory and the typecheck covers google.ts — cost if wrong: a bundling error shows up at the hand-check instead.
Task 10: Ruling: hand-check results are recorded in .scratch/mobile-app-starter/hand-check-2026-10-28.md instead of ticking docs/hand-check.md — that file is copied into every Derived App and must stay blank — cost if wrong: none.
Task 10: Ruling: the hand-check build ran from a short-path clone (C:\dev\mas) with CMake 3.31.6 via cmake.dir — the project path breaks ninja 1.10's path limit (issue 01); subst failed (mixed roots) — cost if wrong: none; same commit 40b314f.
Task 10: Ruling: added the Windows native-build workaround to README and docs/building-on-the-starter.md — every Windows developer hits it, and the README setup was otherwise wrong — cost if wrong: none.
Task 10: verified — npm run test:new-app PASS (310 s); Android hand-check 25/25 dark and 25/25 light (2FA reauth code step included); issues 01 (resolved) and 02 (open, dev-only) logged.
Task 10: complete (commits c0940ff..f7def29, tests: npm test → Ran all test suites.)
