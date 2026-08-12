import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DigestService } from './digest.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [DigestService],
  exports: [DigestService],
})
export class DigestModule {}