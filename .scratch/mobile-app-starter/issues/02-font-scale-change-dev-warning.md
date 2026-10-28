# 02: Changing the system font size logs a navigation warning (development only)

Status: open (low priority)

## What happened

During the hand-check (step 25, both modes), changing Settings → Font size while the app was open logged, in development builds only:

    Looks like you have configured linking in multiple places ...
    Looks like you have multiple navigation containers ...

The app kept working and the screen re-laid out correctly.

## Likely cause

Expo's default Android `configChanges` doesn't include `fontScale`, so a font-size change recreates the activity; expo-router briefly sees two roots. The Starter configures no linking itself.

## Options

Leave as is (dev-only), or add `fontScale` to MainActivity's `configChanges` with a config plugin and recheck that text still rescales.
