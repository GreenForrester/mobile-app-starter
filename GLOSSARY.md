# Mobile App Starter

A working React Native app for Android and iOS that exists to be copied as the starting point for new mobile apps.

## Language

### The Starter

**Starter**:
This repo: a working, runnable mobile app whose purpose is to be copied as the starting point for new apps.
_Avoid_: template, skeleton, boilerplate, base

**Derived App**:
A project created by copying the Starter, which then evolves independently of it.
_Avoid_: child app, fork, clone

**App Identity**:
The name, icon, iOS bundle ID and Android package name that make a Derived App distinct from the Starter and from every other Derived App.
_Avoid_: branding, app config

### Signing in

**Sign-in**:
A user proving who they are in order to get into the app.
_Avoid_: login, log in

**Sign-in Method**:
One way a user can sign in: Password, Google or Apple. Each Derived App chooses which ones it offers.
_Avoid_: login component, login type, auth option

**Password Sign-in**:
The Sign-in Method where the user enters an email and password that the Auth Backend checks.
_Avoid_: custom login, email login, credentials login

**Second Factor**:
An extra proof of identity, such as a one-time code, that the Auth Backend can require after a correct password before Sign-in completes. Google and Apple Sign-in Methods never ask for one, because those providers run their own.
_Avoid_: 2FA, MFA, two-step verification

**Auth Backend**:
The service that checks a user's credentials and decides whether Sign-in succeeds, such as Firebase Auth, Supabase or a Derived App's own server.
_Avoid_: database, credential store, auth provider

**Fake Auth Backend**:
The Auth Backend the Starter ships with, which accepts fixed demo credentials so the app works before any real service is set up.
_Avoid_: mock auth, dummy login

### Accounts

**Account**:
A person's identity in the Auth Backend, created by Sign-up or by their first Google or Apple Sign-in.
_Avoid_: profile, user record

**Sign-up**:
Creating an Account with an email and password.
_Avoid_: register, registration

**Password Reset**:
A person who has forgotten their password setting a new one through a link or code from the Auth Backend.
_Avoid_: forgot password, password recovery

**Account Deletion**:
A signed-in person permanently removing their Account from inside the app.
_Avoid_: deactivation, close account

### Screens

**Home**:
The first screen a signed-in person sees, and the placeholder for a Derived App's own content.
_Avoid_: first screen, dashboard, main screen

**Account Screen**:
The screen where a signed-in person sees which Account they're using, signs out, or starts Account Deletion.
_Avoid_: profile, settings

### Appearance

**Theme**:
The one named set of colors, fonts, text sizes and spacing, in light and dark versions, that every screen takes its look from.
_Avoid_: styles, palette, skin, design tokens

**Reference Design**:
A sample screen design, such as a screenshot or Figma file, that a Derived App's Theme is extracted from.
_Avoid_: mockup, sample screen, design file
