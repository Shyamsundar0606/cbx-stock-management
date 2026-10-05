const { spawnSync, spawn } = require('node:child_process');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let started = false;

exports.ensureApi = function ensureApi() {
  if (started || process.env.CI) {
    return;
  }
  started = true;

  const healthCheck = spawnSync(process.execPath, [path.join(__dirname, 'check-api.cjs')], {
    timeout: 1_500,
    windowsHide: true,
    stdio: 'ignore',
  });

  if (healthCheck.status === 0) {
    return;
  }
  if (healthCheck.status === 2) {
    throw new Error('Port 3000 is already being used by another service.');
  }

  const backendDirectory = path.resolve(__dirname, '../backend');
  const loader = pathToFileURL(
    path.join(backendDirectory, 'node_modules/tsx/dist/loader.mjs'),
  ).href;
  const server = spawn(
    process.execPath,
    ['--import', loader, path.join(backendDirectory, 'src/index.ts')],
    {
      cwd: backendDirectory,
      stdio: 'inherit',
      windowsHide: true,
    },
  );

  server.on('error', (error) => console.error('Could not start the API:', error.message));
  process.once('exit', () => server.kill('SIGTERM'));
};
