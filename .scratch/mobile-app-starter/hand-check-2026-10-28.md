# Android hand-check results: 2026-10-28

Device: Android emulator `aea_pixel` (1080x2400), development build of commit 40b314f, built from a short-path clone (`C:\dev\mas`, see issue 01).

| Pass | Steps 1–25 | Notes |
|------|------------|-------|
| Dark | 25/25 pass | Step 19 with a password Account: sign-up, app killed, 5½ min wait, reopened, deletion asked for the password (wrong one rejected under the field), then deleted. |
| Light | 25/25 pass | Step 19 with the 2FA demo Account: after the password, the Code step appeared; 123456 deleted the Account. |

Also confirmed on device:
- The app follows the phone's dark setting (expo-system-ui fix works).
- Quick double tap on Sign in: spinner, one Sign-in, Home once.
- Keyboard doesn't cover fields or the button on Sign-up or Password Reset.
- Largest font size: text wraps, the screen scrolls, nothing cut off. Dev-only warning logged when the font size changes (issue 02).

Screenshots were taken during the run but not committed.
