/**
 * @jest-environment node
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  androidSdkDir,
  avdNames,
  javaMajor,
  localProperties,
  longPathsEnabled,
  needsInstall,
  nodeVersionOk,
  pickCmake,
  readyDevices,
} = require('./run-android');

const tempDirs = [];

function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'run-android-test-'));
  tempDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

describe('localProperties', () => {
  // Gradle reads local.properties as a Java properties file, where a single backslash is an escape.
  it('writes Windows paths with doubled backslashes and an escaped colon', () => {
    const text = localProperties('', {
      'sdk.dir': 'C:\\Users\\you\\AppData\\Local\\Android\\Sdk',
      'cmake.dir': 'C:\\Users\\you\\AppData\\Local\\Android\\Sdk\\cmake\\3.31.6',
    });
    expect(text).toBe(
      'sdk.dir=C\\:\\\\Users\\\\you\\\\AppData\\\\Local\\\\Android\\\\Sdk\n' +
        'cmake.dir=C\\:\\\\Users\\\\you\\\\AppData\\\\Local\\\\Android\\\\Sdk\\\\cmake\\\\3.31.6\n',
    );
  });

  it('replaces the keys it sets and keeps every other line', () => {
    const existing = '# written by hand\r\nsdk.dir=C\\:\\\\old\r\nndk.dir=D\\:\\\\ndk\r\n';
    const text = localProperties(existing, { 'sdk.dir': 'C:\\sdk', 'cmake.dir': 'C:\\cmake' });
    expect(text).toBe('# written by hand\nsdk.dir=C\\:\\\\sdk\nndk.dir=D\\:\\\\ndk\ncmake.dir=C\\:\\\\cmake\n');
  });
});

describe('pickCmake', () => {
  // The default CMake 3.22 ships a ninja that can't use long paths on Windows.
  it('picks the newest installed CMake at 3.31 or above, comparing numerically', () => {
    expect(pickCmake(['3.22.1', '3.31.6', '3.4.0'])).toBe('3.31.6');
    expect(pickCmake(['3.31.6', '4.0.2', '3.22.1'])).toBe('4.0.2');
  });

  it('finds nothing when only older CMake versions are installed', () => {
    expect(pickCmake(['3.22.1', '3.30.5'])).toBeNull();
    expect(pickCmake([])).toBeNull();
  });
});

describe('readyDevices', () => {
  it('lists only devices adb can use, from Windows line endings', () => {
    const output =
      'List of devices attached\r\nemulator-5554\tdevice\r\nR58M123\tunauthorized\r\nemulator-5556\toffline\r\n\r\n';
    expect(readyDevices(output)).toEqual(['emulator-5554']);
  });

  it('finds nothing when no device is attached', () => {
    expect(readyDevices('List of devices attached\r\n\r\n')).toEqual([]);
  });

  // The first adb call of a session starts its server and says so above the header.
  it('skips the lines adb prints while starting its server', () => {
    const output =
      '* daemon not running; starting now at tcp:5037\r\n* daemon started successfully\r\n' +
      'List of devices attached\r\nemulator-5554\tdevice\r\n';
    expect(readyDevices(output)).toEqual(['emulator-5554']);
  });
});

describe('avdNames', () => {
  it('lists virtual devices and skips the emulator log lines around them', () => {
    const output =
      'INFO    | Storing crashdata in: C:\\Users\\you\\AppData\\Local\\Temp\\\\AndroidEmulator\\emu-crash-34.1.19.db, detection is enabled for process: 8068\r\n' +
      'pixel_6_api_34\r\nMy_Tablet-2.1\r\n';
    expect(avdNames(output)).toEqual(['pixel_6_api_34', 'My_Tablet-2.1']);
  });
});

describe('longPathsEnabled', () => {
  it('reads the LongPathsEnabled value from `reg query` output', () => {
    const query = (value) =>
      `\r\nHKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\FileSystem\r\n    LongPathsEnabled    REG_DWORD    ${value}\r\n\r\n`;
    expect(longPathsEnabled(query('0x1'))).toBe(true);
    expect(longPathsEnabled(query('0x0'))).toBe(false);
  });

  it('treats a missing value as off', () => {
    expect(longPathsEnabled('ERROR: The system was unable to find the specified registry key or value.')).toBe(false);
  });
});

describe('nodeVersionOk', () => {
  // Expo and React Native need ^22.13.0 || ^24.3.0 || >= 26.
  it.each([
    ['v22.13.0', true],
    ['v24.21.0', true],
    ['v26.0.0', true],
    ['v22.12.1', false],
    ['v23.11.0', false],
    ['v24.2.0', false],
    ['v20.19.4', false],
  ])('%s -> %s', (version, ok) => {
    expect(nodeVersionOk(version)).toBe(ok);
  });
});

describe('javaMajor', () => {
  it('reads the major version from `java -version` output', () => {
    expect(javaMajor('openjdk version "17.0.20.1" 2026-08-18\nOpenJDK Runtime Environment Temurin')).toBe(17);
    expect(javaMajor('java version "21" 2023-09-19 LTS')).toBe(21);
  });

  it('reads Java 8 from its old 1.8 numbering', () => {
    expect(javaMajor('java version "1.8.0_391"')).toBe(8);
  });

  it('returns null when there is no version line', () => {
    expect(javaMajor("'java' is not recognized as an internal or external command")).toBeNull();
  });
});

describe('androidSdkDir', () => {
  it('prefers ANDROID_HOME over ANDROID_SDK_ROOT', () => {
    expect(androidSdkDir({ ANDROID_HOME: 'D:\\sdk', ANDROID_SDK_ROOT: 'E:\\sdk', LOCALAPPDATA: 'C:\\local' })).toBe(
      'D:\\sdk',
    );
  });

  it("falls back to Android Studio's default folder", () => {
    expect(androidSdkDir({ LOCALAPPDATA: 'C:\\local' })).toBe(path.join('C:\\local', 'Android', 'Sdk'));
  });
});

describe('needsInstall', () => {
  function project({ installed, lockAge }) {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}');
    if (installed) {
      fs.mkdirSync(path.join(dir, 'node_modules'));
      const marker = path.join(dir, 'node_modules', '.package-lock.json');
      fs.writeFileSync(marker, '{}');
      // npm writes node_modules/.package-lock.json on every install.
      const lockTime = new Date('2026-10-01T00:00:00Z');
      const installTime = new Date(lockTime.getTime() + (lockAge === 'newer' ? -60_000 : 60_000));
      fs.utimesSync(path.join(dir, 'package-lock.json'), lockTime, lockTime);
      fs.utimesSync(marker, installTime, installTime);
    }
    return dir;
  }

  it('installs when node_modules is missing', () => {
    expect(needsInstall(project({ installed: false }))).toBe(true);
  });

  it('installs when package-lock.json changed after the last install', () => {
    expect(needsInstall(project({ installed: true, lockAge: 'newer' }))).toBe(true);
  });

  it('skips the install when node_modules is up to date', () => {
    expect(needsInstall(project({ installed: true, lockAge: 'older' }))).toBe(false);
  });
});
