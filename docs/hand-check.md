# Android hand-check

Run this on an Android emulator or phone before you call the app done. Start it with `npx expo run:android`.

Work through every step twice: first with the phone in **light** mode, then in **dark** mode (Settings → Display → Dark theme). Mark each pass by changing `[ ]` to `[x]`. If a step fails, record it in the issue tracker (see `docs/agents/issue-tracker.md`).

Each step is written as **action → what you should see**.

## Sign-in

| # | Step | Light | Dark |
|---|------|-------|------|
| 1 | Launch the app → the splash screen, then the Sign in screen with the demo accounts box. | [ ] | [ ] |
| 2 | Tap **Sign in** with both fields empty → "Enter your email." under Email and "Enter your password." under Password. | [ ] | [ ] |
| 3 | Enter `demo@example.com` and a wrong password → "That email and password don't match. Try again." above the form. The email is still filled in. | [ ] | [ ] |
| 4 | Enter `demo@example.com` / `Password123!` and tap **Sign in** twice quickly → the button shows a spinner, and Home appears once, saying "Signed in as demo@example.com". | [ ] | [ ] |
| 5 | Close the app completely (swipe it away), then reopen it → Home, without signing in again. | [ ] | [ ] |
| 6 | Open the **Account** tab and tap **Sign out** → the Sign in screen. Reopen the app → still the Sign in screen. | [ ] | [ ] |

## Second Factor

| # | Step | Light | Dark |
|---|------|-------|------|
| 7 | Sign in as `demo-2fa@example.com` / `Password123!` → the Verification code screen. Tapping Code opens a number pad. | [ ] | [ ] |
| 8 | Enter `000000` and tap **Verify** → "That code isn't right. Check it and try again." under the field. | [ ] | [ ] |
| 9 | Enter `123456` and tap **Verify** → Home, saying "Signed in as demo-2fa@example.com". Sign out. | [ ] | [ ] |

## Sign-up

| # | Step | Light | Dark |
|---|------|-------|------|
| 10 | On Sign in, tap **Create an account** → the Create an account screen, with "At least 8 characters" under Password. | [ ] | [ ] |
| 11 | Enter `Demo@Example.com` / `abcdefgh` and tap **Create account** → "An account with that email already exists. Try signing in." under Email. | [ ] | [ ] |
| 12 | Enter a new email with `abcdefg` (7 characters) → "Use at least 8 characters." under Password. | [ ] | [ ] |
| 13 | Change the password to `abcdefgh` → Home, saying "Signed in as" and the new email. | [ ] | [ ] |

## Password Reset

| # | Step | Light | Dark |
|---|------|-------|------|
| 14 | Sign out. On Sign in, tap **Forgot password?** → the Reset password screen. Tap **Send reset link** with the field empty → "Enter your email." | [ ] | [ ] |
| 15 | Send for `demo@example.com`, then for `nobody@example.com` → both show "If an account exists for that email, we've sent a link to reset your password." | [ ] | [ ] |
| 16 | Tap **Back to sign in** → the Sign in screen. `demo@example.com` / `Password123!` still works. | [ ] | [ ] |

## Account Deletion

| # | Step | Light | Dark |
|---|------|-------|------|
| 17 | Signed in as the Account from step 13: on the Account tab, tap **Delete account** → "Delete your account? This can't be undone." Tap **Cancel** → still signed in. | [ ] | [ ] |
| 18 | Tap **Delete account**, then the red **Delete account** → the Sign in screen. Signing in with that Account → "That email and password don't match. Try again." | [ ] | [ ] |
| 19 | Create another Account, leave the app open for more than 5 minutes, then delete it → "For your security, sign in again to delete your account." with a Password field. | [ ] | [ ] |
| 20 | Enter a wrong password and tap **Confirm** → "That email and password don't match. Try again." under the field. Enter the right password → the Sign in screen. | [ ] | [ ] |

## Look and feel

| # | Step | Light | Dark |
|---|------|-------|------|
| 21 | On every screen, text is easy to read, text fields have a visible border, and error messages are red. | [ ] | [ ] |
| 22 | Buttons dim briefly when tapped, and nothing on screen jumps. | [ ] | [ ] |
| 23 | While typing on Sign-up and Password Reset, the keyboard doesn't cover the field, and you can scroll to the button. | [ ] | [ ] |
| 24 | Status bar icons are visible, and nothing sits under the camera cutout or the gesture bar. The tab bar highlights the active tab. | [ ] | [ ] |
| 25 | Set the phone's font size to the largest (Settings → Display → Font size) → text wraps and nothing is cut off. | [ ] | [ ] |
