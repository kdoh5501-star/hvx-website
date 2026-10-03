// Renders scripts/og.html to public/og.png (1200x630) with a locally installed Chrome or Edge.
// Run: npm run og   (set CHROME_PATH to override the browser location)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) throw new Error('No Chrome/Edge found. Set CHROME_PATH.');

mkdirSync('public', { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'hvx-og-'));
const raw = join(profile, 'og-raw.png');
try {
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--allow-file-access-from-files', `--user-data-dir=${profile}`, '--virtual-time-budget=3000',
    '--window-size=1200,630', `--screenshot=${raw}`, pathToFileURL(resolve('scripts/og.html')).href,
  ], { stdio: 'inherit' });
  // Crop guards against browsers that add a few pixels of window chrome in headless mode.
  await sharp(raw).extract({ left: 0, top: 0, width: 1200, height: 630 }).png({ compressionLevel: 9 }).toFile('public/og.png');
  console.log('public/og.png written');
} finally {
  rmSync(profile, { recursive: true, force: true });
}
