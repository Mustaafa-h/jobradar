import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const scripts = [
  'ingest-telegram-posts.js',
  'classify-telegram-posts.js',
  'send-digest.js',
];

function runScript(script: string): void {
  console.log(`\nRunning ${script}...`);

  const result = spawnSync(process.execPath, [resolve(__dirname, script)], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${script} failed with exit code ${result.status ?? 'unknown'}`,
    );
  }
}

function main(): void {
  console.log('Starting complete JobRadar check');

  for (const script of scripts) {
    runScript(script);
  }

  console.log('\nJobRadar check completed successfully');
}

try {
  main();
} catch (error: unknown) {
  console.error(
    '\nJobRadar check failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}