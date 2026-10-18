// Cross-platform production build: `npm run build:prod`.
// Equivalent to SITE_ENV=production astro build (SITE_URL is read from the environment / .env).
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, SITE_ENV: 'production' },
});
process.exit(result.status ?? 1);
