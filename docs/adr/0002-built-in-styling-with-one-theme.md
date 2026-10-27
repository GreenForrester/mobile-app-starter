# Built-in styling with one Theme, no UI library

Every screen in every Derived App is written in whatever styling approach the Starter picks, and each Derived App gets its own look by extracting a Theme from a Reference Design. We use React Native's built-in `StyleSheet` with a single Theme (light and dark, following the phone's setting) shared through context, and no UI or styling library, so restyling a Derived App means replacing the Theme rather than fighting a library's look or rewriting class names.

## Considered Options

- **NativeWind (Tailwind classes)**: quick for developers who know Tailwind, but every screen fills with class names, so leaving it later means rewriting every screen.
- **A component library (React Native Paper, Tamagui)**: ready-made inputs and buttons, but every Derived App starts out looking like the library and needs heavy restyling to look like its Reference Design.

## Consequences

- Screens use only Theme values, never raw colors, font sizes or spacing. That rule is what keeps applying a Reference Design to a single place.
- A Derived App is still free to add a UI library later; nothing in the Starter gets in the way.
