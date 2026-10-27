/**
 * @jest-environment node
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createDerivedApp, deriveIdentity, findStarterIdentity } = require('./new-app');

const repoRoot = path.resolve(__dirname, '..');
const starterIdentity = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app-identity.json'), 'utf8'));
const tempDirs = [];

function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'new-app-test-'));
  tempDirs.push(dir);
  return dir;
}

beforeAll(() => {
  Object.assign(process.env, {
    GIT_AUTHOR_NAME: 'New App Test',
    GIT_AUTHOR_EMAIL: 'new-app@example.com',
    GIT_COMMITTER_NAME: 'New App Test',
    GIT_COMMITTER_EMAIL: 'new-app@example.com',
  });
});

afterAll(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

describe('deriveIdentity', () => {
  it('builds the App Identity from a one-word name', () => {
    expect(deriveIdentity({ name: 'FitTrack', id: 'com.yourname.fittrack' })).toEqual({
      name: 'FitTrack',
      slug: 'fittrack',
      scheme: 'fittrack',
      iosBundleId: 'com.yourname.fittrack',
      androidPackage: 'com.yourname.fittrack',
    });
  });

  it('turns spaces into dashes in the slug and drops them from the scheme', () => {
    expect(deriveIdentity({ name: 'My Fit App', id: 'com.yourname.myfitapp' })).toMatchObject({
      slug: 'my-fit-app',
      scheme: 'myfitapp',
    });
  });

  // com.my_company.app: Expo's iOS bundle ID check rejects underscores.
  it.each(['com.my-company.app', 'fittrack', 'com.1abc.app', 'com.my_company.app'])(
    'refuses the identifier %s',
    (id) => {
      expect(() => deriveIdentity({ name: 'FitTrack', id })).toThrow(/at least two parts/);
    },
  );

  // Android package names can't contain Java keywords; `expo run:android` fails on them.
  it.each(['com.yourname.new', 'com.acme.default'])('refuses %s, which uses a reserved word', (id) => {
    expect(() => deriveIdentity({ name: 'FitTrack', id })).toThrow(/reserved word/);
  });

  // The URL scheme comes from the slug and must start with a letter.
  it('asks for a --slug when the name starts with a digit', () => {
    expect(() => deriveIdentity({ name: '7 Minute Workout', id: 'com.yourname.workout' })).toThrow(
      /start with a letter.*--slug/,
    );
    expect(
      deriveIdentity({ name: '7 Minute Workout', id: 'com.yourname.workout', slug: 'seven-minute-workout' }).scheme,
    ).toBe('sevenminuteworkout');
  });

  it('asks for --slug when the name has no usable characters', () => {
    expect(() => deriveIdentity({ name: '日本', id: 'com.yourname.nihon' })).toThrow(/--slug/);
    expect(deriveIdentity({ name: '日本', id: 'com.yourname.nihon', slug: 'nihon' }).slug).toBe('nihon');
  });
});

it('finds the Starter identity in the Starter itself', () => {
  expect(findStarterIdentity(repoRoot, starterIdentity)).toContain('app-identity.json');
});

describe('createDerivedApp', () => {
  it('creates a Derived App with its own App Identity and a fresh git history', () => {
    const target = path.join(tempDir(), 'fittrack');
    const { identity, todos } = createDerivedApp({
      sourceDir: repoRoot,
      targetDir: target,
      name: 'FitTrack',
      id: 'com.yourname.fittrack',
    });

    const read = (file) => fs.readFileSync(path.join(target, file), 'utf8');
    expect(JSON.parse(read('app-identity.json'))).toEqual(identity);
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.name).toBe('fittrack');
    expect(pkg.scripts['new-app']).toBeUndefined();
    for (const gone of ['scripts/new-app.js', '.scratch', 'node_modules', '.superpowers', 'docs/superpowers']) {
      expect(fs.existsSync(path.join(target, gone))).toBe(false);
    }
    expect(read('README.md').split(/\r?\n/)[0]).toBe('# FitTrack');
    // The how-to guide travels with every Derived App, and its README points to it.
    expect(fs.existsSync(path.join(target, 'docs/building-on-the-starter.md'))).toBe(true);
    expect(read('README.md')).toContain('docs/building-on-the-starter.md');
    expect(read('GLOSSARY.md').split(/\r?\n/)[0]).toBe('# FitTrack');
    expect(findStarterIdentity(target, starterIdentity)).toEqual([]);
    const commits = execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: target, encoding: 'utf8' }).trim();
    expect(commits).toBe('1');
    expect(todos.join('\n')).toMatch(/assets\/icon\.png/);
  });

  it('refuses a folder that already has files and leaves it untouched', () => {
    const target = tempDir();
    fs.writeFileSync(path.join(target, 'keep.txt'), 'keep');
    expect(() =>
      createDerivedApp({ sourceDir: repoRoot, targetDir: target, name: 'FitTrack', id: 'com.yourname.fittrack' }),
    ).toThrow(/already exists/);
    expect(fs.readdirSync(target)).toEqual(['keep.txt']);
  });

  it('refuses a bad identifier before writing anything', () => {
    const target = path.join(tempDir(), 'fittrack');
    expect(() =>
      createDerivedApp({ sourceDir: repoRoot, targetDir: target, name: 'FitTrack', id: 'com.my-company.app' }),
    ).toThrow(/at least two parts/);
    expect(fs.existsSync(target)).toBe(false);
  });

  it('refuses a folder inside the Starter', () => {
    expect(() =>
      createDerivedApp({
        sourceDir: repoRoot,
        targetDir: path.join(repoRoot, 'fittrack'),
        name: 'FitTrack',
        id: 'com.yourname.fittrack',
      }),
    ).toThrow(/outside the Starter/);
    expect(fs.existsSync(path.join(repoRoot, 'fittrack'))).toBe(false);
  });
});
