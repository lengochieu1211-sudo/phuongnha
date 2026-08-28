import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import {defineConfig} from 'vite';

const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')) as { version: string };

function resolveCommitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 12);
  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'local';
  } catch {
    return 'local';
  }
}

export default defineConfig(() => {
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();
  const buildChannel = process.env.GITHUB_REF_NAME || process.env.VERCEL_GIT_COMMIT_REF || 'local';

  return {
    base: '/phuongnha/',
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_TIME__: JSON.stringify(buildTime),
      __COMMIT_SHA__: JSON.stringify(resolveCommitSha()),
      __BUILD_CHANNEL__: JSON.stringify(buildChannel),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
