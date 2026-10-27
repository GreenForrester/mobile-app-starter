/**
 * @jest-environment node
 */
// Slow on purpose: creates a real Derived App, installs it and runs its own tests.
// Run with `npm run test:new-app`; `npm test` skips it.
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createDerivedApp } = require('./new-app');

const FIFTEEN_MINUTES = 15 * 60 * 1000;
let workDir;

beforeAll(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'new-app-e2e-'));
  Object.assign(process.env, {
    GIT_AUTHOR_NAME: 'New App Test',
    GIT_AUTHOR_EMAIL: 'new-app@example.com',
    GIT_COMMITTER_NAME: 'New App Test',
    GIT_COMMITTER_EMAIL: 'new-app@example.com',
  });
});

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

function run(command, cwd) {
  try {
    execSync(command, { cwd, stdio: 'pipe', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.trim().split('\n').slice(-40).join('\n');
    throw new Error(`"${command}" failed in ${cwd}:\n${output}`);
  }
}

it(
  'creates a Derived App whose own tests pass',
  () => {
    const { targetDir } = createDerivedApp({
      sourceDir: path.resolve(__dirname, '..'),
      targetDir: path.join(workDir, 'fittrack'),
      name: 'FitTrack',
      id: 'com.yourname.fittrack',
    });

    run('npm ci --no-audit --no-fund --prefer-offline', targetDir);
    run('npx jest --ci', targetDir);
  },
  FIFTEEN_MINUTES,
);
