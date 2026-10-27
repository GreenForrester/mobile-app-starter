# Spec: Mobile App Starter

The Starter is a working Expo app for Android and iOS with Sign-in and a first screen. It exists to be copied: a developer or Claude Code runs one command to create a Derived App and starts building from there.

Vocabulary follows [`GLOSSARY.md`](../../GLOSSARY.md). Decisions behind this spec: [ADR 0001](../../docs/adr/0001-expo-with-generated-native-folders.md) (Expo, generated native folders) and [ADR 0002](../../docs/adr/0002-built-in-styling-with-one-theme.md) (built-in styling, one Theme).

## Technical baseline

- Expo, latest stable SDK at build time; `ios/` and `android/` are generated, never committed (ADR 0001).
- TypeScript and Expo Router (Expo's defaults). Confirm during planning.
- Built-in `StyleSheet` with one Theme shared through context; no UI or styling library (ADR 0002).
- Because the Google sign-in library is native, the app runs in a development build, not Expo Go.

## Sign-in

### Sign-in Methods

| Sign-in Method | In a fresh copy | How a Derived App turns it on |
|---|---|---|
| Password Sign-in | On, working against the Fake Auth Backend | Already on |
| Google | Built in, off | Switch on in the app config and add its own Google Cloud OAuth client |
| Apple | Built in, off | Switch on in the app config; needs a paid Apple Developer Program membership |

- The sign-in screen shows only the methods that are switched on.
- Keys live in a local file that git ignores. A Derived App can never inherit the Starter's keys, because the Starter has none.
- Note for Derived Apps: if an iOS app offers Google, App Store rule 4.8 also requires an equivalent privacy-focused option, usually Apple.

### Second Factor

- After a correct password, the Auth Backend may require a Second Factor before Sign-in completes. The app then shows a code entry step.
- The Starter builds in no particular way of sending codes; each Derived App's Auth Backend decides that.
- Google and Apple Sign-in never ask for a Second Factor.

### Staying signed in

- After Sign-in, the person stays signed in across app restarts until they sign out or delete their Account. The session lives in the phone's secure storage.
- Sign-out ends the session and returns to the sign-in screen.

## Accounts

- **Sign-up**: email and password create an Account and sign the person in.
- **Password Reset**: the person enters their email and is told a reset email has been sent. The message is the same whether or not an Account exists for that email, so the screen never reveals who has an Account.
- **Account Deletion**: from the Account Screen, with a confirmation step. If the person's Sign-in isn't recent, they must sign in again first, then deletion goes ahead. Afterwards they land on the sign-in screen.
- Both app stores require in-app Account Deletion for any app that creates Accounts, including through Google or Apple. Google Play also asks for a web link for deletion, which each Derived App provides when it publishes.

## Auth Backend seam

All Sign-in and Account actions go through one seam, so a Derived App swaps the Fake Auth Backend for a real one (Firebase Auth, Supabase or its own server) without touching the screens. The seam is shaped around how Firebase Auth and Supabase actually behave, not around the Fake.

The seam supports these actions and outcomes:

| Action | Outcomes the screens must handle |
|---|---|
| Sign-up | Signed in · email already in use · password too weak |
| Password Sign-in | Signed in · Second Factor required · wrong email or password |
| Submit Second Factor code | Signed in · wrong code |
| Google or Apple Sign-in | Signed in · cancelled by the person |
| Request Password Reset | Reset email sent (always) |
| Sign in again (recent Sign-in) | Confirmed · wrong password |
| Account Deletion | Deleted · recent Sign-in required |
| Sign-out | Signed out |
| Restore session on launch | Signed in · signed out |

Every action can also fail because the Auth Backend can't be reached; the screens show a retry message for that.

### Fake Auth Backend

The default Auth Backend. It runs on the phone and needs no setup, but it behaves like a real service wherever that matters for the screens:

- Two demo Accounts: one plain, one that requires a Second Factor with a fixed code. Their details are listed in the README.
- Accounts created by Sign-up are stored on the phone and survive restarts.
- Password Reset reports "email sent" and changes nothing.
- Account Deletion asks for a recent Sign-in when the last one is older than a short window.
- Google and Apple Sign-in are accepted without checking the identity, since there's nothing real to check against.

## Screens

**Signed out:** Sign-in (email, password and any switched-on Google or Apple buttons, plus links to Sign-up and "Forgot password?"), Sign-up, Password Reset and Second Factor code entry.

**Signed in:** two bottom tabs.

- **Home**: greets the signed-in person. It is the placeholder for the Derived App's own content; new screens are added as tabs or pushed from Home.
- **Account Screen**: shows the signed-in Account's email, Sign out and Delete account.

## Theme

- One Theme holds colors, fonts, text sizes and spacing, each in light and dark versions. The app follows the phone's light or dark setting.
- Screens use only Theme values, never raw colors, font sizes or spacing (ADR 0002).
- A Derived App gets its look by extracting a Theme from a Reference Design (a screenshot or Figma file). The Theme has room for custom fonts.
- Accessibility in both light and dark: text contrast at least 4.5:1, tap targets at least 44 points, form fields with visible labels, and errors shown next to the field they belong to.

## New-app command

One command turns a copy of the Starter into a Derived App. Humans and Claude Code run the same command; it takes its answers as arguments so it can also run without prompts.

1. Takes the app name and an identifier such as `com.yourname.fittrack`.
2. Copies the Starter into a new folder.
3. Sets the whole App Identity: name, slug, URL scheme, iOS bundle ID and Android package name. The Starter's placeholder icon is kept and flagged as a to-do.
4. Starts a fresh git history in the new folder.
5. Removes the new-app command from the copy.
6. Checks that nothing in the copy still identifies it as the Starter, and fails loudly if something does.

The command works on Windows, macOS and Linux. It has to be updated whenever the Starter gains something new that carries the Starter's identity.

## Definition of done

1. **Automated tests** against the Fake Auth Backend, runnable on any machine with no emulator:
   - Sign-up, including email already in use
   - Password Sign-in, including wrong password
   - Sign-in with a Second Factor, right and wrong code
   - Password Reset request
   - Sign-out, and staying signed in after a restart
   - Account Deletion, with and without a recent Sign-in
   - Google Sign-in through a stand-in for the Google library
2. **New-app command test**: create a Derived App in a temporary folder, confirm its App Identity changed and nothing still says "starter", then run the copy's own tests.
3. **Hand-check on Android** (emulator or phone), from a written checklist in the repo: every flow above, in both light and dark.

## Known unproven areas

- **iOS**: configured but not built or run, because there's no Mac or Apple Developer account yet. Apple Sign-in stays off until there is.
- **Google Sign-in**: built in and covered by automated tests with a stand-in, but never run against Google for real.
- **Real Auth Backends**: the seam has only ever run against the Fake Auth Backend.

## Developer setup (Windows)

- Node.js LTS and git.
- Android Studio (Android SDK and emulator) and a JDK, to build and run the development build locally. A physical Android phone works instead of the emulator.
- iOS builds need a Mac, or a cloud build service plus a paid Apple Developer Program membership.

## Out of scope

- Real Auth Backend adapters (Firebase, Supabase or others)
- Linking Accounts that share an email across Sign-in Methods
- Editing profile details
- End-to-end tests driving the app on a device (such as Maestro)
- Push notifications, translations, analytics, CI and app store publishing

## Open questions for planning

1. **Email confirmation after Sign-up.** Supabase requires it by default; Firebase doesn't. Proposed: the seam allows a "check your email" outcome and the screens handle it, while the Fake signs in immediately.
2. **Demo Account details.** Pick the two demo emails, password and fixed Second Factor code, and decide whether development builds show them on the sign-in screen.
3. **Recent Sign-in window.** How long a Sign-in counts as recent for Account Deletion.
4. **Password rules.** Minimum length and anything else the Fake enforces for "password too weak".
