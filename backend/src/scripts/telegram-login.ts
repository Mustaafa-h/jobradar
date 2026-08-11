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
    const currentUser = await telegram.start({
      phone: () => telegram.input('Phone number with country code > '),
      code: () => telegram.input('Telegram login code > '),
      password: () => telegram.input('Telegram 2FA password > '),
    });

    console.log(`Telegram authorization succeeded for ${currentUser.displayName}`);
  } finally {
    await telegram.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Telegram authorization failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});