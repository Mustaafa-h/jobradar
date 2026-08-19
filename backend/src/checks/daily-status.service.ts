import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TelegramBotService } from '../notifications/telegram-bot.service';

export interface DailyStatusResult {
  status: 'sent' | 'skipped' | 'warning';
  relevantJobsDeliveredToday: number;
  channelsCheckedToday: number;
}

@Injectable()
export class DailyStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBot: TelegramBotService,
  ) {}

  async send(): Promise<DailyStatusResult> {
    const startOfToday = this.getStartOfTodayInBaghdad();

    const [relevantJobsDeliveredToday, channelsCheckedToday] =
      await Promise.all([
        this.prisma.telegramPost.count({
          where: {
            deliveredAt: {
              gte: startOfToday,
            },
          },
        }),
        this.prisma.ingestionCheckpoint.count({
          where: {
            lastCheckedAt: {
              gte: startOfToday,
            },
            channel: {
              enabled: true,
            },
          },
        }),
      ]);

    if (relevantJobsDeliveredToday > 0) {
      console.log(
        'Daily status not sent because relevant jobs were already delivered today',
      );

      return {
        status: 'skipped',
        relevantJobsDeliveredToday,
        channelsCheckedToday,
      };
    }

    if (channelsCheckedToday === 0) {
      await this.telegramBot.sendMessage(
        '⚠️ JobRadar did not complete a channel check today. Please review the workflow.',
      );

      return {
        status: 'warning',
        relevantJobsDeliveredToday,
        channelsCheckedToday,
      };
    }

    await this.telegramBot.sendMessage(
      '✅ JobRadar is running normally.\nNo relevant jobs were found today.',
    );

    console.log('Daily no-jobs status sent');

    return {
      status: 'sent',
      relevantJobsDeliveredToday,
      channelsCheckedToday,
    };
  }

  private getStartOfTodayInBaghdad(now = new Date()): Date {
    const baghdadOffsetMilliseconds = 3 * 60 * 60 * 1000;
    const baghdadTime = new Date(
      now.getTime() + baghdadOffsetMilliseconds,
    );

    return new Date(
      Date.UTC(
        baghdadTime.getUTCFullYear(),
        baghdadTime.getUTCMonth(),
        baghdadTime.getUTCDate(),
      ) - baghdadOffsetMilliseconds,
    );
  }
}