#!/usr/bin/env node
// Creates a Derived App: a copy of the Starter with its own App Identity and a fresh git
// history. Humans and Claude Code run the same command:
//
//   npm run new-app -- --name "FitTrack" --id com.yourname.fittrack [--slug fittrack] [--dir ../fittrack]
//
// Keep this up to date whenever the Starter gains something new that carries its identity.
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// The identifier is both the iOS bundle ID and the Android package name, so it has to pass
// both of Expo's checks: Android's segment rules, and iOS's ban on underscores.
const ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/;
const ID_MESSAGE =
  'Identifier must look like com.yourname.app: at least two parts separated by dots, each starting with a letter and using only letters and numbers.';
// Java keywords and literals, which Android package names can't contain (same list as Expo's).
const RESERVED_SEGMENTS = new Set(
  (
    'abstract assert boolean break byte case catch char class const continue default do double else enum ' +
    'extends final finally float for goto if implements import instanceof int interface long native new ' +
    'package private protected public return short static strictfp super switch synchronized this throw ' +
    'throws transient try void volatile while true false null'
  ).split(' '),
);
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Never copied into a Derived App: build output, the Starter's own planning and issues,
// local keys, and this command itself.
const EXCLUDED = [
  '.git',
  'node_modules',
  'ios',
  'android',
  '.expo',
  'dist',
  'coverage',
  '.scratch',
  '.superpowers',
  path.join('docs', 'superpowers'),
  path.join('scripts', 'new-app.js'),
  path.join('scripts', 'new-app.test.js'),
  path.join('scripts', 'new-app.e2e.test.js'),
];
const LOCAL_ENV_FILE = /^\.env.*\.local$/;
const SKIPPED_BY_IDENTITY_CHECK = ['.git', 'node_modules', '.claude'];

function deriveIdentity({ name, id, slug }) {
  const appName = String(name ?? '').trim();
  if (!appName) throw new Error('Pass the app name with --name.');
  if (!ID_PATTERN.test(String(id ?? ''))) throw new Error(ID_MESSAGE);
  const reserved = id.split('.').find((segment) => RESERVED_SEGMENTS.has(segment));
  if (reserved) throw new Error(`"${reserved}" is a reserved word in Android package names; choose another identifier.`);

  const appSlug =
    slug ??
    appName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  if (!appSlug) throw new Error("Couldn't make a slug from that name; pass --slug.");
  if (!SLUG_PATTERN.test(appSlug)) throw new Error('Slug must use lowercase letters, numbers and dashes.');
  // The URL scheme is the slug without dashes, and a scheme has to start with a letter.
  if (!/^[a-z]/.test(appSlug)) {
    throw new Error('The URL scheme must start with a letter; pass --slug (for example --slug seven-minute-workout).');
  }

  return { name: appName, slug: appSlug, scheme: appSlug.replace(/-/g, ''), iosBundleId: id, androidPackage: id };
}

// Relative paths (with forward slashes) of text files that contain any App Identity value.
function findStarterIdentity(dir, identity) {
  const values = [...new Set(Object.values(identity))];
  const found = [];
  walk(dir, (file) => {
    const content = readText(file);
    if (content !== null && values.some((value) => content.includes(value))) {
      found.push(path.relative(dir, file).split(path.sep).join('/'));
    }
  });
  return found;
}

function createDerivedApp({ sourceDir, targetDir, name, id, slug, git = true }) {
  // 1. Check everything before writing anything.
  const identity = deriveIdentity({ name, id, slug });
  const source = path.resolve(sourceDir);
  const target = path.resolve(targetDir);
  const starterIdentity = readJson(path.join(source, 'app-identity.json'));

  if (target === source || target.startsWith(source + path.sep)) {
    throw new Error('Choose a folder outside the Starter for the new app.');
  }
  if (fs.existsSync(target) && (!fs.statSync(target).isDirectory() || fs.readdirSync(target).length > 0)) {
    throw new Error(`${target} already exists and isn't empty.`);
  }
  if (git) runGit(source, ['--version']);

  // 2. Copy the Starter.
  fs.cpSync(source, target, {
    recursive: true,
    filter: (file) => {
      const relative = path.relative(source, file);
      if (!relative) return true;
      if (LOCAL_ENV_FILE.test(path.basename(file))) return false;
      return !EXCLUDED.some((excluded) => relative === excluded || relative.startsWith(excluded + path.sep));
    },
  });

  // 3–5. Give the copy its own identity.
  writeJson(path.join(target, 'app-identity.json'), identity);

  const pkg = readJson(path.join(target, 'package.json'));
  pkg.name = identity.slug;
  delete pkg.scripts['new-app'];
  delete pkg.scripts['test:new-app'];
  writeJson(path.join(target, 'package.json'), pkg);

  const lockPath = path.join(target, 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    const lock = readJson(lockPath);
    lock.name = identity.slug;
    if (lock.packages && lock.packages['']) lock.packages[''].name = identity.slug;
    writeJson(lockPath, lock);
  }

  const glossaryPath = path.join(target, 'GLOSSARY.md');
  if (fs.existsSync(glossaryPath)) {
    const lines = fs.readFileSync(glossaryPath, 'utf8').split(/\r?\n/);
    lines[0] = `# ${identity.name}`;
    fs.writeFileSync(glossaryPath, lines.join('\n'));
  }

  fs.writeFileSync(path.join(target, 'README.md'), readme(identity));

  // 6. Nothing may still identify the copy as the Starter.
  const leftovers = findStarterIdentity(target, starterIdentity);
  if (leftovers.length > 0) {
    throw new Error(`These files still carry the Starter's identity: ${leftovers.join(', ')}`);
  }

  // 7. A fresh history, not a fork of the Starter's.
  if (git) {
    runGit(target, ['init', '-q']);
    runGit(target, ['add', '-A']);
    runGit(target, ['commit', '-q', '-m', `chore: create ${identity.name} from the Starter`]);
  }

  return {
    targetDir: target,
    identity,
    todos: [
      'Run npm install in the new folder.',
      'Replace the placeholder images: assets/icon.png, assets/splash-icon.png, assets/favicon.png and assets/android-icon-*.png.',
      'Extract the Theme from your Reference Design: edit src/theme/theme.ts and src/theme/fonts.ts.',
      'Switch on Google or Apple in app.config.ts if you need them (keys go in .env.local).',
      'Plug in your real Auth Backend in src/auth/backend.ts, and set demoAccounts to null.',
    ],
  };
}

function readme(identity) {
  return [
    `# ${identity.name}`,
    '',
    'Created from the Starter. It runs as a development build (not Expo Go).',
    '',
    '## Run it',
    '',
    '```sh',
    'npm install',
    'npx expo run:android',
    '```',
    '',
    '## Test it',
    '',
    '```sh',
    'npm test',
    'npm run typecheck',
    '```',
    '',
    'Before calling a change done on a device, work through `docs/hand-check.md` on Android.',
    '',
    '## Build on it',
    '',
    '[`docs/building-on-the-starter.md`](docs/building-on-the-starter.md) covers the demo Accounts, switching on',
    'Google or Apple, plugging in a real Auth Backend, applying a Reference Design, adding screens, and what',
    'is still unproven.',
    '',
    'The decisions this app inherited are in `docs/adr/`, and its vocabulary is in `GLOSSARY.md`.',
    '',
  ].join('\n');
}

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED_BY_IDENTITY_CHECK.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else if (entry.isFile()) visit(full);
  }
}

// The file's text, or null for binary files (anything with a NUL byte near the start).
function readText(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.subarray(0, 8000).includes(0)) return null;
  return buffer.toString('utf8');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function runGit(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, stdio: 'pipe', encoding: 'utf8' });
  } catch (error) {
    const detail = (error.stderr || error.message || '').trim();
    throw new Error(`git ${args[0]} failed in ${cwd}: ${detail}`);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--help' || flag === '-h') return { help: true };
    if (!flag.startsWith('--')) throw new Error(`Unexpected argument: ${flag}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`Missing a value for ${flag}.`);
    args[flag.slice(2)] = value;
    i++;
  }
  return args;
}

const USAGE = 'Usage: npm run new-app -- --name "FitTrack" --id com.yourname.fittrack [--slug fittrack] [--dir ../fittrack]';

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(USAGE);
      return;
    }
    const sourceDir = path.resolve(__dirname, '..');
    const { slug } = deriveIdentity({ name: args.name, id: args.id, slug: args.slug });
    const targetDir = path.resolve(args.dir ?? path.join(sourceDir, '..', slug));
    const result = createDerivedApp({ sourceDir, targetDir, name: args.name, id: args.id, slug: args.slug });

    console.log(`Created ${result.identity.name} in ${result.targetDir}\n`);
    console.log('App Identity:');
    for (const [key, value] of Object.entries(result.identity)) console.log(`  ${key}: ${value}`);
    console.log('\nNext:');
    for (const todo of result.todos) console.log(`  - ${todo}`);
  } catch (error) {
    console.error(error.message);
    console.error(USAGE);
    process.exit(1);
  }
}

module.exports = { createDerivedApp, deriveIdentity, findStarterIdentity };

if (require.main === module) main();
