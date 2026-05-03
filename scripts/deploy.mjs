import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);
const ghPages = require('gh-pages');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const cnameSource = resolve(root, 'CNAME');
const cnameTarget = resolve(dist, 'CNAME');
const nojekyllTarget = resolve(dist, '.nojekyll');

await mkdir(dist, { recursive: true });
await copyFile(cnameSource, cnameTarget);
await writeFile(nojekyllTarget, '');

await new Promise((resolvePromise, rejectPromise) => {
  ghPages.publish(
    dist,
    {
      branch: 'gh-pages',
      dotfiles: true,
      message: 'Deploy Images on a Map v2 scaffold',
    },
    (error) => {
      if (error) {
        rejectPromise(error);
        return;
      }
      resolvePromise();
    },
  );
});

await new Promise((resolvePromise, rejectPromise) => {
  const child = spawn(
    'gh',
    [
      'api',
      '-X',
      'PUT',
      'repos/{owner}/{repo}/pages',
      '-F',
      'cname=facemap.thefrenchartist.dev',
      '-F',
      'source[branch]=gh-pages',
      '-F',
      'source[path]=/',
    ],
    {
      cwd: root,
      stdio: 'inherit',
    },
  );

  child.on('error', rejectPromise);
  child.on('exit', (code) => {
    if (code === 0) {
      resolvePromise();
      return;
    }
    rejectPromise(new Error(`gh api exited with status ${code}`));
  });
});

console.log('Published to gh-pages and updated the Pages source.');

