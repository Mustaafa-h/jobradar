import { readFile } from 'node:fs/promises';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

interface ChannelConfigEntry {
  telegramId: bigint;
  title: string;
  enabled: boolean;
}

@Injectable()
export class ChannelsConfigService implements OnModuleInit {
  private readonly logger = new Logger(ChannelsConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const configPath = this.configService.getOrThrow<string>(
      'TELEGRAM_CHANNELS_CONFIG_PATH',
    );

    const fileContents = await readFile(configPath, 'utf8');
    const parsed: unknown = JSON.parse(fileContents);
    const channels = this.parseChannels(parsed);

    for (const channel of channels) {
      await this.prisma.channel.upsert({
        where: {
          telegramId: channel.telegramId,
        },
        update: {
          title: channel.title,
          enabled: channel.enabled,
        },
        create: {
          telegramId: channel.telegramId,
          title: channel.title,
          enabled: channel.enabled,
        },
      });
    }

    const configuredIds = channels.map((channel) => channel.telegramId);

    if (configuredIds.length === 0) {
      await this.prisma.channel.updateMany({
        data: { enabled: false },
      });
    } else {
      await this.prisma.channel.updateMany({
        where: {
          telegramId: {
            notIn: configuredIds,
          },
        },
        data: { enabled: false },
      });
    }

    const enabledCount = channels.filter((channel) => channel.enabled).length;

    this.logger.log(
      `Synchronized ${channels.length} configured channels; ${enabledCount} enabled`,
    );
  }

  private parseChannels(value: unknown): ChannelConfigEntry[] {
    if (!this.isRecord(value) || !Array.isArray(value.channels)) {
      throw new Error('channels.json must contain a channels array');
    }

    const seenIds = new Set<string>();

    return value.channels.map((entry, index) => {
      if (
        !this.isRecord(entry) ||
        typeof entry.telegramId !== 'string' ||
        !/^-?\d+$/.test(entry.telegramId) ||
        typeof entry.title !== 'string' ||
        entry.title.trim().length === 0 ||
        typeof entry.enabled !== 'boolean'
      ) {
        throw new Error(`Invalid channel configuration at index ${index}`);
      }

      if (seenIds.has(entry.telegramId)) {
        throw new Error(`Duplicate Telegram channel ID: ${entry.telegramId}`);
      }

      seenIds.add(entry.telegramId);

      return {
        telegramId: BigInt(entry.telegramId),
        title: entry.title.trim(),
        enabled: entry.enabled,
      };
    });
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}