import { TelegramClient } from '@mtcute/node';

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  const apiId = Number.parseInt(
    requireEnvironmentVariable('TELEGRAM_API_ID'),
    10,
  );

  if (!Number.isSafeInteger(apiId)) {
    throw new Error('TELEGRAM_API_ID must be a valid integer');
  }

  const telegram = new TelegramClient({
    apiId,
    apiHash: requireEnvironmentVariable('TELEGRAM_API_HASH'),
    storage: requireEnvironmentVariable('TELEGRAM_SESSION_PATH'),
  });

  try {
    await telegram.start();

    console.log('\nID | TYPE | USERNAME | TITLE');
    console.log('-----------------------------------------------');

    for await (const dialog of telegram.iterDialogs({ archived: 'keep' })) {
      const peer = dialog.peer;

      if (peer.type !== 'chat') {
        continue;
      }

      const type = peer.isGroup ? 'group' : 'channel';
      const username = peer.username ? `@${peer.username}` : '-';

      console.log(`${peer.id} | ${type} | ${username} | ${peer.displayName}`);
    }
  } finally {
    await telegram.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Failed to list Telegram channels:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});