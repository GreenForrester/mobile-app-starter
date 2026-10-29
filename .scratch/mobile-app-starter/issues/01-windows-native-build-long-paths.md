# 01: Android native build fails on Windows with long paths

Status: resolved (documented workaround)

## What happened

`npx expo run:android` failed in the project folder (`C:\Users\<you>\Desktop\Test Projects\mobile-app-starter`):

    ninja: error: mkdir(CMakeFiles/worklets.dir/C_/Users/.../node_modules/react-native-worklets/Common/cpp/worklets): No such file or directory

CMake nests the project's absolute path inside its build folder, so object paths pass 260 characters (one was 295). Windows long paths were already enabled, but the default CMake 3.22.1 ships ninja 1.10.2, which can't use them.

## What didn't work

- `subst` to a short drive letter: Node resolves modules back to the real path, and Gradle refuses mixed roots ("this and base files have different roots").
- A short path alone (`C:\dev\mas`): still 295 characters.

## What works (verified 2026-10-28)

A short project path plus CMake 3.31.6 (ninja 1.12.1), selected with `cmake.dir` in `android/local.properties`. See "Windows: native build fails with a long path" in `docs/building-on-the-starter.md`.

## Update 2026-10-29: the short path isn't needed

`gradlew app:assembleDebug` passed in the Starter's own 55-character folder (`C:\Users\<you>\Desktop\Test Projects\mobile-app-starter`) with CMake 3.31.6 and long paths on. CMake 3.31 plus long paths is the whole fix. `run-android.cmd` writes `cmake.dir` on every run, and `setup-windows.cmd` installs CMake 3.31 and turns on long paths.
