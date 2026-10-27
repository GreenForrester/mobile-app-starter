# Build the Starter on Expo, with generated native folders

The Starter exists to be copied, and every Derived App must be renamed (app name, iOS bundle ID, Android package name) and given its own Sign-in Methods. We build it on Expo, on the latest stable SDK, with `ios/` and `android/` generated from the app config rather than committed, so that renaming and adding native sign-in libraries are config changes instead of hand edits to Xcode and Gradle files, which is where copies most often break.

## Considered Options

- **Bare React Native CLI**: direct control of native code, but every copy means editing native project files by hand. Rejected because safe copying matters more to the Starter than native control, and Expo still allows custom native code through config plugins and local modules when a Derived App needs it.

## Consequences

- `ios/` and `android/` are build output, not source: change the app config or a config plugin, never the generated folders.
- Once Google sign-in is added, Expo Go can't run the app; developers use a development build instead.
- Each Derived App inherits the Expo SDK version that was current when it was copied, and upgrades on its own schedule.
