#!/usr/bin/env node
// Work around a Next CLI quirk where `npm run lint` can be misinterpreted
// as a project directory named "lint". We invoke Next directly.

const { spawnSync } = require('node:child_process');

// Ensure no stray lifecycle event confuses downstream tooling
try { delete process.env.npm_lifecycle_event; } catch {}

const result = spawnSync(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'lint', '.'],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 0);
