import { open, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = resolve(root, '.cache');
const pidFile = resolve(cacheDir, 'vite.pid');
const logFile = resolve(cacheDir, 'vite.log');
const devHost = process.env.DEV_HOST ?? '127.0.0.1';
const devPort = process.env.DEV_PORT ?? '4173';
const devUrl = `http://${devHost}:${devPort}/`;

async function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForServer(url) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 15000) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep trying until the dev server is ready.
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

const mode = process.argv[2];

if (mode === 'up') {
  await mkdir(cacheDir, { recursive: true });

  try {
    const existingPid = Number((await readFile(pidFile, 'utf8')).trim());
    if (Number.isInteger(existingPid) && existingPid > 0 && (await isAlive(existingPid))) {
      console.log(`Dev server already running at ${devUrl}`);
      process.exit(0);
    }
    await rm(pidFile, { force: true });
  } catch {
    // No active server yet.
  }

  const logHandle = await open(logFile, 'a');
  const child = spawn('npm', ['run', 'dev', '--', '--host', devHost, '--port', devPort], {
    cwd: root,
    detached: true,
    stdio: ['ignore', logHandle.fd, logHandle.fd],
  });

  child.unref();
  await writeFile(pidFile, `${child.pid}\n`);
  await logHandle.close();
  await waitForServer(devUrl);

  console.log(`Dev server running at ${devUrl}`);
  process.exit(0);
}

if (mode === 'down') {
  try {
    const pid = Number((await readFile(pidFile, 'utf8')).trim());
    if (Number.isInteger(pid) && pid > 0) {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        try {
          process.kill(pid, 'SIGTERM');
        } catch {
          // Ignore if already stopped.
        }
      }
    }
  } catch {
    // No pid file.
  }

  await rm(pidFile, { force: true });
  console.log('Dev server stopped');
  process.exit(0);
}

throw new Error(`Unknown dev-server mode: ${mode}`);
