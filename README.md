# JobRadar

JobRadar is a personal job-monitoring system that reads selected Telegram channels, stores new posts, filters them against a software engineering profile, and delivers relevant recommendations through a private Telegram bot.

The personal MVP focuses on reducing noise from high-volume Telegram job channels. It recommends jobs only; it does not contact employers or apply automatically.

## Features

- Monitors selected Telegram channels through an authorized personal account.
- Reads the previous 24 hours during the first ingestion.
- Uses checkpoints to fetch only newer messages afterward.
- Supports Arabic and English job posts.
- Prevents duplicate post storage and duplicate recommendations.
- Classifies jobs as `Strong`, `Good`, `Stretch`, or `Not Relevant`.
- Sends up to 10 recommendations per private Telegram digest.
- Runs automatically every two hours through n8n.
- Deletes stored posts after seven days.
- Uses a deterministic matcher, so the MVP requires no paid AI API.

## Target Profile

The current matcher prioritizes early-career opportunities in:

- Full-stack development
- Frontend development
- React and Next.js
- Backend development
- Node.js, Express, and NestJS
- Flutter and mobile development
- General software and web engineering
- Paid internships, graduate programs, and technical traineeships

Junior QA automation and junior DevOps/cloud roles may appear as `Stretch` recommendations.

Supported locations:

- Baghdad
- Erbil
- Remote roles available from Iraq

Jobs requesting two to three years of experience can appear as `Stretch`. Senior roles, unrelated occupations, unsupported locations, and explicitly unpaid opportunities are excluded.

## How It Works

```text
Selected Telegram channels
        |
        v
Telegram ingestion (mtcute)
        |
        v
PostgreSQL + Prisma
        |
        v
Deterministic relevance matcher
        |
        v
Strong / Good / Stretch
        |
        v
Private Telegram bot digest

n8n triggers the protected pipeline every two hours.
```

For each scheduled check, JobRadar:

1. Reads new messages from enabled Telegram channels.
2. Stores new text posts in PostgreSQL.
3. Classifies previously unclassified posts.
4. Sends an ordered digest of undelivered relevant jobs.
5. Marks successfully delivered recommendations.
6. Removes posts older than seven days.

## Technology

- NestJS
- TypeScript
- PostgreSQL 17
- Prisma ORM
- mtcute (Telegram MTProto client)
- Telegram Bot API
- n8n
- Docker Compose
- Jest

## Repository Structure

```text
JobRadar/
|- backend/                 NestJS application
|  |- prisma/               Prisma schema and migrations
|  `- src/
|     |- channels/          Private channel configuration sync
|     |- checks/            Protected pipeline trigger endpoint
|     |- database/          Prisma database integration
|     |- digest/            Digest selection and formatting
|     |- health/            Health endpoint
|     |- matching/          Deterministic relevance rules
|     |- notifications/     Private Telegram bot delivery
|     `- scripts/           Ingestion, classification, cleanup, and utilities
|- config/
|  `- channels.example.json
|- compose.yaml
`- .env.example
```

## Requirements

- Docker Desktop or Docker Engine with Docker Compose
- Telegram API credentials from [my.telegram.org](https://my.telegram.org/apps)
- A private Telegram bot created through [@BotFather](https://t.me/BotFather)
- Membership in the Telegram channels that will be monitored

Local Node.js and PostgreSQL installations are not required when using Docker.

## Configuration

### 1. Environment variables

Copy the example file:

```powershell
Copy-Item ".env.example" ".env"
```

On Linux or macOS:

```bash
cp .env.example .env
```

Fill in every value in `.env`:

```env
POSTGRES_PASSWORD=replace_with_a_strong_password

TELEGRAM_API_ID=replace_with_telegram_api_id
TELEGRAM_API_HASH=replace_with_telegram_api_hash
TELEGRAM_BOT_TOKEN=replace_with_bot_token
TELEGRAM_DIGEST_CHAT_ID=replace_with_private_chat_id

CHECK_TRIGGER_TOKEN=replace_with_random_trigger_token
N8N_ENCRYPTION_KEY=replace_with_random_encryption_key
```

Never commit the populated `.env` file.

### 2. Monitored channels

Copy the example configuration:

```powershell
Copy-Item "config/channels.example.json" "config/channels.json"
```

On Linux or macOS:

```bash
cp config/channels.example.json config/channels.json
```

Add the selected Telegram marked IDs and titles:

```json
{
  "channels": [
    {
      "telegramId": "-1001234567890",
      "title": "Example Jobs Channel",
      "enabled": true
    }
  ]
}
```

Telegram channel IDs must use the marked `-100...` format and remain strings.

The real `config/channels.json` file is private and excluded from Git.

## Start the Application

Build and start PostgreSQL, the backend, and n8n:

```powershell
docker compose --env-file ".env" up -d --build
```

Check container status:

```powershell
docker compose --env-file ".env" ps
```

Local services:

- Backend health: `http://127.0.0.1:3000/health`
- n8n: `http://127.0.0.1:5678`

## First Telegram Authorization

The personal Telegram account must be authorized once. Run:

```powershell
docker compose --env-file ".env" run --rm backend node dist/scripts/telegram-login.js
```

Enter the phone number, Telegram login code, and two-factor password only in the terminal. The resulting session is stored in a private Docker volume.

Treat the Telegram session as a password. Anyone who obtains it may be able to access the authorized account.

## Discover Available Channels

List the channels and groups available to the authorized account:

```powershell
docker compose --env-file ".env" run --rm backend node dist/scripts/list-telegram-channels.js
```

Use the displayed marked IDs to prepare `config/channels.json`.

## Run a Check Manually

Run the complete pipeline directly:

```powershell
docker compose --env-file ".env" run --rm backend node dist/scripts/run-jobradar-check.js
```

Alternatively, call the protected endpoint:

```powershell
$token = (Get-Content ".env" | Where-Object { $_.StartsWith('CHECK_TRIGGER_TOKEN=') } | Select-Object -Last 1).Substring('CHECK_TRIGGER_TOKEN='.Length)
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3000/checks/run" -Headers @{ "x-jobradar-token" = $token }
```

The endpoint rejects missing or incorrect trigger tokens and prevents overlapping checks within the backend process.

## n8n Schedule

The local workflow uses:

1. A **Schedule Trigger** configured for every two hours.
2. An **HTTP Request** node configured with:
   - Method: `POST`
   - URL: `http://backend:3000/checks/run`
   - Header: `x-jobradar-token`
   - Value: the private `CHECK_TRIGGER_TOKEN`
   - Timeout: `600000` milliseconds

Publish the workflow to activate the schedule. n8n data and encrypted credentials persist in the private `n8n_data` Docker volume.

## Tests

Run the Jest test suite from the project root:

```powershell
docker run --rm -it -v "${PWD}:/workspace" -w /workspace/backend node:24-bookworm npm test
```

On Windows, an explicit project path can also be used:

```powershell
docker run --rm -it -v "E:\Projects\JobRadar:/workspace" -w /workspace/backend node:24-bookworm npm test
```

## Security and Privacy

The repository must never include:

- `.env`
- Telegram API credentials
- Telegram bot tokens
- Telegram login codes or two-factor passwords
- Telegram session files or exported session strings
- The real monitored-channel configuration
- PostgreSQL or n8n volume data

The backend and n8n ports are bound to `127.0.0.1` for local development. Do not expose them publicly without authentication, TLS, firewall rules, and an appropriate reverse proxy.

The MTProto client technically has the permissions of the authorized personal Telegram account. JobRadar’s code limits its behavior to reading configured channels, but Telegram does not provide a read-only personal-account session.

## MVP Scope

Included:

- Telegram-channel monitoring
- Profile-based deterministic filtering
- Strong, Good, and Stretch recommendations
- Private Telegram digests
- Scheduled checks
- Seven-day post retention

Not included in V1:

- Automatic job applications
- Employer contact automation
- Application tracking
- Feedback buttons
- Web dashboard
- Paid AI classification

## Current Status

The local MVP is functional. The remaining production work is inexpensive always-on hosting, deployment hardening, and public repository publication with secrets excluded.

## License

This project is intended as a personal portfolio project. Add a license before accepting outside contributions or reuse.
