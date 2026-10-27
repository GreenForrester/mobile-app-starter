# Mobile App Starter

The Starter is a working Expo app for Android and iOS. It includes Password Sign-in, a Second Factor step, Sign-up, Password Reset, Account Deletion, and a Home screen to build on. It exists to be copied: one command creates a Derived App with its own App Identity.

The project's vocabulary is defined in [`GLOSSARY.md`](GLOSSARY.md). The decisions behind it are recorded in [`docs/adr/`](docs/adr/).

## Setup on Windows

- Node.js LTS and git.
- Android Studio with the Android SDK, plus an emulator or an Android phone with USB debugging on.
- Set `ANDROID_HOME` (usually `%LOCALAPPDATA%\Android\Sdk`) and add `%ANDROID_HOME%\platform-tools` to `PATH`. Check that `adb --version` prints a version.
- JDK 17, with `JAVA_HOME` pointing to it.
- iOS builds need a Mac, or a cloud build service such as EAS Build plus a paid Apple Developer Program membership.

## Run on Android

```sh
npm install
npx expo run:android
```

The first run builds a development build, which takes several minutes, and installs it on the running emulator or connected phone. After that, `npx expo start` reloads your changes. Use the development build; Expo Go isn't supported.

## Demo Accounts

While the Fake Auth Backend is active, these Accounts work, and the sign-in screen lists them:

| Email                  | Password       | Second Factor code |
| ---------------------- | -------------- | ------------------ |
| `demo@example.com`     | `Password123!` | none               |
| `demo-2fa@example.com` | `Password123!` | `123456`           |

- **Your own Accounts:** Accounts you create with Sign-up are stored on the phone.
- **Deleted demo Accounts** come back on the next launch.
- **Recent Sign-in:** a Sign-in counts as recent for 5 minutes. After that, Account Deletion asks you to sign in again first.

## Create a Derived App

```sh
npm run new-app -- --name "FitTrack" --id com.yourname.fittrack
```

- **`--id`** becomes both the iOS bundle ID and the Android package name. It needs at least two parts separated by dots. Each part starts with a letter and uses only letters, numbers and underscores.
- **Where it goes:** a sibling folder named after the slug (here `../fittrack`), unless you pass `--dir`. Pass `--slug` to choose the slug yourself.
- **What the command does:**
  - sets the whole App Identity: name, slug, URL scheme, bundle ID and package name
  - starts a fresh git history
  - removes itself from the copy
  - fails if anything in the copy still identifies it as the Starter
  - prints a to-do list for you to finish: icons, Theme, keys and Auth Backend
- **Not copied:** the Starter's own plans and issues (`docs/superpowers/`, `.scratch/`), local keys (`.env*.local`) and build output.

When the Starter gains something new that carries its identity, update `scripts/new-app.js` too.

## Switch on Google or Apple

1. **Switch it on.** In `app.config.ts`, set `google: true` or `apple: true` in `signInMethods`.
2. **Google keys.** In Google Cloud, create an Android OAuth client for your package name and your signing key's SHA-1, plus a Web client. Then add both values to `.env.local`, which git ignores. The config refuses to build if either value is missing.

   ```sh
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-ios-client-id
   ```

3. **Apple** needs a paid Apple Developer Program membership. Its button only appears on iPhone.
4. **Rebuild** with `npx expo run:android`, because the native configuration changed.

Before you ship:

- **App Store rule 4.8:** an iOS app that offers Google must also offer an equivalent privacy-focused option, usually Sign in with Apple.
- **Google's branding:** the Google button is a Theme-styled "Continue with Google" button. Check Google's branding guidelines before you ship it.
- **Verifying identities:** the Fake Auth Backend accepts any Google or Apple identity without checking it. A real Auth Backend must verify the ID token.

## Plug in a real Auth Backend

1. **Implement `AuthBackend`** from `src/auth/types.ts` on top of Firebase Auth, Supabase or your own server. The app never connects directly to a database.
2. **Wire it in.** Export it as `authBackend` in `src/auth/backend.ts`, and set `demoAccounts` to `null`.
3. **Map your service's responses** to the outcomes in `src/auth/types.ts`. For example:
   - "requires recent login" becomes `recent-sign-in-required`
   - "multi-factor required" becomes `second-factor-required`
   - network errors become `unreachable`

   The screens already handle every outcome.
4. **Match the password rule.** Keep `MIN_PASSWORD_LENGTH` in `src/auth/password-rules.ts` in step with your backend's rule, so the Sign-up hint stays true.

## Apply a Reference Design

Give Claude Code a screenshot or Figma file and ask it to extract the Theme. Only two files change:

- `src/theme/theme.ts`: colors (light and dark), text sizes, spacing and corner radius
- `src/theme/fonts.ts`: the font files and family names

Screens use only Theme values, so the new look applies everywhere. Two tests protect this:

- One test fails if a raw color, font size or spacing value appears in `app/` or `src/`.
- A contrast test checks that text stays readable (4.5:1) in both light and dark.

## Known unproven areas

- **iOS** is configured but has never been built or run, because there's no Mac or Apple Developer account yet. Apple Sign-in stays off until there is.
- **Google Sign-in** is built in and covered by automated tests with a stand-in, but has never run against Google for real.
- **Real Auth Backends:** the seam has only ever run against the Fake Auth Backend.

## Tests

```sh
npm test               # every account flow against the Fake Auth Backend; no emulator needed
npm run typecheck
npm run test:new-app   # slow: creates a Derived App, installs it and runs its own tests
```

Before calling a change done on a device, work through [`docs/hand-check.md`](docs/hand-check.md) on Android.

## Where things live

| Path               | What it holds                                                          |
| ------------------ | ---------------------------------------------------------------------- |
| `app/`             | Routes: the signed-out `(auth)` screens and the signed-in `(app)` tabs |
| `src/auth/`        | The Auth Backend seam, the Fake Auth Backend and `AuthProvider`        |
| `src/theme/`       | The Theme and fonts                                                    |
| `src/ui/`          | Building blocks: text, buttons, fields, messages and the screen frame  |
| `tests/flows/`     | End-to-end flows through the real routes                               |
| `scripts/new-app.js` | The new-app command                                                  |
