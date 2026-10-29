#!/usr/bin/env node
// Builds the app and runs it on the Android emulator (or a connected phone), on Windows:
//
//   run-android.cmd [--check] [--clean] [--avd <name>]
//
// It checks the machine, installs npm packages when package-lock.json changed, starts an emulator
// when nothing is attached, generates android/ and points it at CMake 3.31+ (the Windows long-path
// fix), then hands over to `expo run:android`, which builds, installs, opens the app and keeps
// Metro running. setup-windows.cmd installs anything the check finds missing.
'use strict';

const { execFileSync, spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');
// The default CMake 3.22 ships a ninja that can't use long paths on Windows.
const MIN_CMAKE = [3, 31];
const MIN_JAVA = 17;
const BOOT_TIMEOUT_MS = 5 * 60 * 1000;
const USAGE = 'Usage: run-android.cmd [--check] [--clean] [--avd <name>]';

// Sets keys in a local.properties file's text, escaped the way Java properties files need, and
// keeps every other line.
function localProperties(existing, values) {
  const escape = (value) => value.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
  const pending = new Map(Object.entries(values));
  const lines = existing
    .split(/\r?\n/)
    .filter((line) => line !== '')
    .map((line) => {
      const key = line.split('=')[0].trim();
      if (!pending.has(key)) return line;
      const value = pending.get(key);
      pending.delete(key);
      return `${key}=${escape(value)}`;
    });
  for (const [key, value] of pending) lines.push(`${key}=${escape(value)}`);
  return lines.join('\n') + '\n';
}

// The newest of the installed CMake versions (folder names under <sdk>/cmake) that is new enough.
function pickCmake(versions) {
  const usable = versions
    .filter((version) => /^\d+(\.\d+)*$/.test(version))
    .filter((version) => compareVersions(parseVersion(version), MIN_CMAKE) >= 0)
    .sort((a, b) => compareVersions(parseVersion(b), parseVersion(a)));
  return usable[0] ?? null;
}

function parseVersion(version) {
  return version.split('.').map(Number);
}

function compareVersions(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

// Serials of the devices in `adb devices` output that are ready to install on.
function readyDevices(output) {
  const lines = output.split(/\r?\n/);
  const header = lines.findIndex((line) => line.startsWith('List of devices attached'));
  return lines
    .slice(header + 1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'device')
    .map(([serial]) => serial);
}

// Virtual device names from `emulator -list-avds`, which mixes in its own log lines.
function avdNames(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[\w.-]+$/.test(line));
}

function longPathsEnabled(regQueryOutput) {
  return /LongPathsEnabled\s+REG_DWORD\s+0x1\b/.test(regQueryOutput);
}

// Expo and React Native need Node ^22.13.0 || ^24.3.0 || >= 26 (their package.json engines).
function nodeVersionOk(version) {
  const [major, minor] = parseVersion(version.replace(/^v/, ''));
  if (major === 22) return minor >= 13;
  if (major === 24) return minor >= 3;
  return major >= 26;
}

function javaMajor(javaVersionOutput) {
  const match = /version "(\d+)(?:\.(\d+))?/.exec(javaVersionOutput);
  if (!match) return null;
  const first = Number(match[1]);
  return first === 1 && match[2] ? Number(match[2]) : first;
}

function androidSdkDir(env) {
  if (env.ANDROID_HOME) return env.ANDROID_HOME;
  if (env.ANDROID_SDK_ROOT) return env.ANDROID_SDK_ROOT;
  return env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, 'Android', 'Sdk') : null;
}

// npm rewrites node_modules/.package-lock.json on every install, so a package-lock.json newer
// than it means a pull or an edit changed the dependencies since.
function needsInstall(projectDir) {
  const installed = path.join(projectDir, 'node_modules', '.package-lock.json');
  if (!fs.existsSync(installed)) return true;
  return fs.statSync(path.join(projectDir, 'package-lock.json')).mtimeMs > fs.statSync(installed).mtimeMs;
}

// What the machine has. Each check says what's wrong and how to fix it.
function checkMachine(sdk) {
  const adb = sdk && path.join(sdk, 'platform-tools', 'adb.exe');
  const emulator = sdk && path.join(sdk, 'emulator', 'emulator.exe');
  const cmakeVersions = sdk && fs.existsSync(path.join(sdk, 'cmake')) ? fs.readdirSync(path.join(sdk, 'cmake')) : [];
  const cmake = pickCmake(cmakeVersions);
  const java = javaMajor(capture(process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : 'java', ['-version']));
  const hasEmulator = Boolean(emulator) && fs.existsSync(emulator);
  const avds = hasEmulator ? avdNames(capture(emulator, ['-list-avds'])) : [];
  const devices = adb && fs.existsSync(adb) ? readyDevices(capture(adb, ['devices'])) : [];
  const longPaths = longPathsEnabled(
    capture('reg', ['query', 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem', '/v', 'LongPathsEnabled']),
  );

  const checks = [
    { name: `Node.js ${process.version}`, ok: nodeVersionOk(process.version), fix: 'Install the current Node.js LTS.' },
    {
      name: `JDK ${MIN_JAVA}+ (found ${java ?? 'none'})`,
      ok: java !== null && java >= MIN_JAVA,
      fix: `Install JDK ${MIN_JAVA} and set JAVA_HOME to it.`,
    },
    { name: `Android SDK (${sdk ?? 'not found'})`, ok: Boolean(sdk) && fs.existsSync(sdk), fix: 'Install the Android SDK.' },
    { name: 'adb (SDK platform-tools)', ok: Boolean(adb) && fs.existsSync(adb), fix: 'Install the SDK platform-tools.' },
    { name: 'Android Emulator', ok: hasEmulator, fix: 'Install the SDK emulator package.' },
    {
      name: `CMake ${MIN_CMAKE.join('.')}+ (found ${cmake ?? 'none'})`,
      ok: cmake !== null,
      fix: 'Install CMake 3.31 from the SDK, for the Windows long-path fix.',
    },
    {
      name: `A virtual device or connected phone (${[...avds, ...devices].join(', ') || 'none'})`,
      ok: avds.length > 0 || devices.length > 0,
      fix: 'Create an Android virtual device, or plug in a phone with USB debugging on.',
    },
    { name: 'Windows long paths', ok: longPaths, fix: 'Turn on Windows long paths (needs an administrator).' },
  ];
  return { checks, cmake };
}

// A command's stdout and stderr together, or '' when it can't run.
function capture(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function run(command, cwd = PROJECT_DIR) {
  console.log(`\n> ${command}`);
  // npm and npx are .cmd files on Windows, which Node only starts through a shell.
  const result = spawnSync(command, { cwd, shell: true, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`"${command}" failed.`);
}

async function ensureDevice(sdk, avdName) {
  const adb = path.join(sdk, 'platform-tools', 'adb.exe');
  const devices = readyDevices(execFileSync(adb, ['devices'], { encoding: 'utf8' }));
  if (devices.length > 0) {
    console.log(`Using ${devices.join(', ')}.`);
    return;
  }

  const emulator = path.join(sdk, 'emulator', 'emulator.exe');
  const avds = avdNames(capture(emulator, ['-list-avds']));
  if (avdName && !avds.includes(avdName)) {
    throw new Error(`There's no virtual device named ${avdName}. You have: ${avds.join(', ') || 'none'}.`);
  }
  const avd = avdName ?? avds[0];
  console.log(`Starting the ${avd} emulator...`);
  spawn(emulator, ['-avd', avd], { detached: true, stdio: 'ignore' }).unref();

  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (capture(adb, ['shell', 'getprop', 'sys.boot_completed']).trim() === '1') {
      console.log('The emulator is ready.');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error('The emulator did not finish starting within 5 minutes. Check its window, then run this again.');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--help' || flag === '-h') args.help = true;
    else if (flag === '--check') args.check = true;
    else if (flag === '--clean') args.clean = true;
    else if (flag === '--avd') {
      args.avd = argv[i + 1];
      if (!args.avd || args.avd.startsWith('--')) throw new Error('Missing a value for --avd.');
      i++;
    } else throw new Error(`Unexpected argument: ${flag}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return;
  }
  if (process.platform !== 'win32') {
    throw new Error('This script is for Windows. On macOS or Linux, follow "Run on Android" in the README.');
  }

  const sdk = androidSdkDir(process.env);
  const { checks, cmake } = checkMachine(sdk);
  console.log('Checking this machine:');
  for (const check of checks) console.log(`  ${check.ok ? 'OK     ' : 'MISSING'}  ${check.name}`);
  const missing = checks.filter((check) => !check.ok);
  if (missing.length > 0) {
    console.log('\nTo fix:');
    for (const check of missing) console.log(`  - ${check.fix}`);
    console.log('\nsetup-windows.cmd does all of this for you.');
    process.exitCode = 1;
    return;
  }
  if (args.check) {
    console.log('\nReady to build. Run run-android.cmd.');
    return;
  }

  if (needsInstall(PROJECT_DIR)) run('npm install');
  await ensureDevice(sdk, args.avd);

  const androidDir = path.join(PROJECT_DIR, 'android');
  if (args.clean || !fs.existsSync(androidDir)) {
    run(`npx expo prebuild --platform android --no-install${args.clean ? ' --clean' : ''}`);
  }
  const propertiesFile = path.join(androidDir, 'local.properties');
  const existing = fs.existsSync(propertiesFile) ? fs.readFileSync(propertiesFile, 'utf8') : '';
  fs.writeFileSync(
    propertiesFile,
    localProperties(existing, { 'sdk.dir': sdk, 'cmake.dir': path.join(sdk, 'cmake', cmake) }),
  );

  run('npx expo run:android');
}

module.exports = {
  androidSdkDir,
  avdNames,
  javaMajor,
  localProperties,
  longPathsEnabled,
  needsInstall,
  nodeVersionOk,
  pickCmake,
  readyDevices,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`\n${error.message}`);
    console.error(USAGE);
    process.exit(1);
  });
}
