# Building on the Starter

This guide covers turning a copy of the Starter into your own app. Terms like Auth Backend, Sign-in Method and Reference Design are defined in [`GLOSSARY.md`](../GLOSSARY.md). The decisions behind the Starter are recorded in [`docs/adr/`](adr/).

## Demo Accounts

While the Fake Auth Backend is active, these Accounts work, and the sign-in screen lists them:

| Email                  | Password       | Second Factor code |
| ---------------------- | -------------- | ------------------ |
| `demo@example.com`     | `Password123!` | none               |
| `demo-2fa@example.com` | `Password123!` | `123456`           |

- **Your own Accounts:** Accounts you create with Sign-up are stored on the phone.
- **Deleted demo Accounts** come back on the next launch.
- **Recent Sign-in:** a Sign-in counts as recent for 5 minutes. After that, Account Deletion asks you to sign in again first. The 2FA demo Account also has to enter its code.

## Add a screen

| You want | Where it goes |
| --- | --- |
| A new tab | A file in `app/(app)/(tabs)/`, plus a `<Tabs.Screen>` entry in `app/(app)/(tabs)/_layout.tsx` |
| A screen opened from Home or another tab | A file in `app/(app)/`, such as `app/(app)/workout.tsx`, opened with `router.push('/workout')` |
| A screen for signed-out people, such as onboarding | A file in `app/(auth)/` |

- **Signed-in screens stay under `app/(app)/`.** Everything there is reachable only while signed in. A screen placed directly in `app/` would be reachable signed out, including through a deep link.
- **Style from the Theme.** Take values from `useTheme()` and build with the blocks in `src/ui/`. A test fails if a screen uses a raw color, font size or spacing value.

## Switch on Google or Apple

1. **Switch it on.** In `app.config.ts`, set `google: true` or `apple: true` in `signInMethods`.
2. **Google keys.** In Google Cloud, create these OAuth clients:
   - **Web client:** always needed.
   - **Android client:** for your package name and your signing key's SHA-1. For debug builds, run `./gradlew signingReport` in the generated `android/` folder to find the SHA-1.
   - **iOS client:** only if the app runs on iPhone.

   Then add the values to `.env.local`, which git ignores:

   ```sh
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   # iPhone only: the iOS client's reversed client ID.
   GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-ios-client-id
   ```

   The config refuses to build without the Web client ID. The iOS client ID is worked out from the URL scheme.
3. **Apple** needs a paid Apple Developer Program membership. Its button only appears on iPhone.
4. **Rebuild** with `npx expo run:android`, because the native configuration changed.

Before you ship:

- **App Store rule 4.8:** an iOS app that offers Google must also offer an equivalent privacy-focused option, usually Sign in with Apple.
- **Google's branding:** the Google button is a Theme-styled "Continue with Google" button. Check Google's branding guidelines.
- **Verifying identities:** the Fake Auth Backend accepts any Google or Apple identity without checking it. Your real Auth Backend must verify the ID token.
- **Signing out of Google:** Sign-out and Account Deletion also sign out of Google, so the next person can choose a different Google account.

## Plug in a real Auth Backend

1. **Implement `AuthBackend`** from `src/auth/types.ts` on top of Firebase Auth, Supabase or your own server. Never connect the app directly to a database: its password would have to ship inside the app.
2. **Wire it in.** Export it as `authBackend` in `src/auth/backend.ts`, and set `demoAccounts` to `null`.
3. **Map your service's responses** to the outcomes the screens already handle:

   | When your service says | Return |
   | --- | --- |
   | Wrong password, or no such user | `wrong-credentials`, the same for both so nobody can tell which emails have Accounts |
   | Email not confirmed yet (Supabase's default), at Sign-up or Sign-in | `confirmation-required` |
   | Multi-factor required, at Sign-in or when signing in again | `second-factor-required` with a challenge ID, answered through `submitSecondFactor` |
   | Requires a recent login (Firebase, before deleting a user) | `recent-sign-in-required` |
   | Too many requests (HTTP 429) | `rate-limited` |
   | No network, or a timeout | `unreachable` |

4. **Emails arrive trimmed,** and Second Factor codes too. Your backend decides how to treat letter case.
5. **Match the password rule.** Keep `MIN_PASSWORD_LENGTH` in `src/auth/password-rules.ts` in step with your backend's rule, so the Sign-up hint stays true.
6. **Debugging:** in development builds, every error your backend or a provider throws is logged in the Metro log as `[auth] <action> failed`, then shown to the person as "couldn't reach the server".

## Apply a Reference Design

Give Claude Code a screenshot or Figma file and ask it to extract the Theme. Only two files change:

- `src/theme/theme.ts`: colors (light and dark), text sizes, spacing and corner radius
- `src/theme/fonts.ts`: the font files and family names

Screens take every color, font size and spacing value from the Theme, so the new look applies everywhere. A contrast test checks that text stays readable (4.5:1) in both light and dark.

## Known unproven areas

These are inherited from the Starter until your app proves them:

- **iOS** is configured but was never built or run for the Starter. Apple Sign-in stays off until someone has a Mac or an Apple Developer account.
- **Google Sign-in** is built in and covered by automated tests with a stand-in, but has never run against Google for real.
- **Real Auth Backends:** the seam has only ever run against the Fake Auth Backend.

## Tests

```sh
npm test            # every account flow against the Fake Auth Backend; no emulator needed
npm run typecheck
```

Before calling a change done on a device, work through [`hand-check.md`](hand-check.md) on Android.
