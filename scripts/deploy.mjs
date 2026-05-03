import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
      'build_type=workflow',
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

await new Promise((resolvePromise, rejectPromise) => {
  const child = spawn(
    'gh',
    ['workflow', 'run', 'pages.yml', '--ref', 'main'],
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
    rejectPromise(new Error(`gh workflow run exited with status ${code}`));
  });
});

console.log('Triggered the GitHub Pages workflow.');
