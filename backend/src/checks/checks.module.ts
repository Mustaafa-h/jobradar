import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChecksController } from './checks.controller';
import { ChecksService } from './checks.service';
import { DailyStatusService } from './daily-status.service';

@Module({
  imports: [ConfigModule, DatabaseModule, NotificationsModule],
  controllers: [ChecksController],
  providers: [ChecksService, DailyStatusService],
})
export class ChecksModule {}