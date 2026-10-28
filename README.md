# Mobile App Starter

The Starter is a working Expo app for Android and iOS. It includes Password Sign-in, a Second Factor step, Sign-up, Password Reset, Account Deletion, and a Home screen to build on. It exists to be copied: one command creates a Derived App with its own App Identity.

The project's vocabulary is defined in [`GLOSSARY.md`](GLOSSARY.md). The decisions behind it are recorded in [`docs/adr/`](docs/adr/).

## Setup on Windows

- Node.js LTS and git.
- Android Studio with the Android SDK, plus an emulator or an Android phone with USB debugging on.
- Set `ANDROID_HOME` (usually `%LOCALAPPDATA%\Android\Sdk`) and add `%ANDROID_HOME%\platform-tools` to `PATH`. Check that `adb --version` prints a version.
- JDK 17, with `JAVA_HOME` pointing to it.
- CMake 3.31 or newer (Android Studio → SDK Manager → SDK Tools), and a short project folder such as `C:\dev\myapp`. The native build otherwise fails on Windows' path-length limit; see "Windows: native build fails with a long path" in [`docs/building-on-the-starter.md`](docs/building-on-the-starter.md).
- iOS builds need a Mac, or a cloud build service such as EAS Build plus a paid Apple Developer Program membership.

## Run on Android

```sh
npm install
npx expo run:android
```

The first run builds a development build, which takes several minutes, and installs it on the running emulator or connected phone. After that, `npx expo start` reloads your changes. Use the development build; Expo Go isn't supported.

To sign in straight away, use `demo@example.com` / `Password123!`. The sign-in screen lists both demo Accounts.

## Create a Derived App

```sh
npm run new-app -- --name "FitTrack" --id com.yourname.fittrack
```

- **`--id`** becomes both the iOS bundle ID and the Android package name. It needs at least two parts separated by dots. Each part starts with a letter and uses only letters and numbers, and Java reserved words such as `new` aren't allowed.
- **Where it goes:** a sibling folder named after the slug (here `../fittrack`), unless you pass `--dir`. Pass `--slug` to choose the slug yourself. The slug has to start with a letter.
- **What the command does:**
  - sets the whole App Identity: name, slug, URL scheme, bundle ID and package name
  - starts a fresh git history
  - removes itself from the copy
  - fails if anything in the copy still identifies it as the Starter
  - prints a to-do list for you to finish: icons, Theme, keys and Auth Backend
- **Not copied:** the Starter's own plans and issues (`docs/superpowers/`, `.scratch/`), local keys (`.env*.local`) and build output.

When the Starter gains something new that carries its identity, update `scripts/new-app.js` too.

## Build on it

[`docs/building-on-the-starter.md`](docs/building-on-the-starter.md) covers:

- the demo Accounts
- adding screens
- switching on Google or Apple
- plugging in a real Auth Backend
- applying a Reference Design
- what is still unproven

Every Derived App gets a copy of this guide.

## Tests

```sh
npm test               # every account flow against the Fake Auth Backend; no emulator needed
npm run typecheck
npm run test:new-app   # slow: creates a Derived App, installs it and runs its own tests
```

Before calling a change done on a device, work through [`docs/hand-check.md`](docs/hand-check.md) on Android.

## Where things live

| Path                 | What it holds                                                                      |
| -------------------- | ---------------------------------------------------------------------------------- |
| `app/`               | Routes: the signed-out `(auth)` screens, and the signed-in `(app)` stack with its `(tabs)` |
| `src/auth/`          | The Auth Backend seam, the Fake Auth Backend and `AuthProvider`                    |
| `src/theme/`         | The Theme and fonts                                                                |
| `src/ui/`            | Building blocks: text, buttons, fields, messages, the screen frame and `useSubmit` |
| `tests/flows/`       | End-to-end flows through the real routes                                           |
| `scripts/new-app.js` | The new-app command                                                                |
