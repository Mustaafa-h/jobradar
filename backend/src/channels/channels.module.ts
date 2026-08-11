import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ChannelsConfigService } from './channels-config.service';

@Module({
  imports: [DatabaseModule],
  providers: [ChannelsConfigService],
})
export class ChannelsModule {}