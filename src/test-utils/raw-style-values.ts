import fs from 'fs';
import path from 'path';

// Style values that belong in the Theme, not in screens (ADR 0002).
const RAW_STYLE_PATTERNS = [
  /#[0-9a-fA-F]{3,8}\b/,
  /rgba?\(/,
  /fontSize:\s*\d/,
  /fontFamily:\s*['"]/,
  /(margin|padding)\w*:\s*[1-9]/,
  /gap:\s*[1-9]/,
  /borderRadius:\s*[1-9]/,
];

const SKIPPED_DIRS = [path.join('src', 'theme'), path.join('src', 'test-utils')];

export function scanForRawStyleValues(source: string): string[] {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => RAW_STYLE_PATTERNS.some((pattern) => pattern.test(line)));
}

// Lines in app/ and src/ (outside the Theme and test utilities) that use raw style values.
export function findRawStyleValues(rootDir: string): string[] {
  const findings: string[] = [];
  for (const dir of ['app', 'src']) {
    for (const file of listSourceFiles(path.join(rootDir, dir))) {
      const relative = path.relative(rootDir, file);
      if (SKIPPED_DIRS.some((skipped) => relative.startsWith(skipped + path.sep))) continue;
      for (const line of scanForRawStyleValues(fs.readFileSync(file, 'utf8'))) {
        findings.push(`${relative.split(path.sep).join('/')}: ${line}`);
      }
    }
  }
  return findings;
}

function listSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
  });
}
