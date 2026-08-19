import { timingSafeEqual } from 'node:crypto';
import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckResult, ChecksService } from './checks.service';
import {
  DailyStatusResult,
  DailyStatusService,
} from './daily-status.service';

@Controller('checks')
export class ChecksController {
  constructor(
    private readonly checksService: ChecksService,
    private readonly dailyStatusService: DailyStatusService,
    private readonly configService: ConfigService,
  ) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async run(
    @Headers('x-jobradar-token') token?: string,
  ): Promise<CheckResult> {
    this.authorize(token);
    return this.checksService.run();
  }

  @Post('daily-status')
  @HttpCode(HttpStatus.OK)
  async sendDailyStatus(
    @Headers('x-jobradar-token') token?: string,
  ): Promise<DailyStatusResult> {
    this.authorize(token);
    return this.dailyStatusService.send();
  }

  private authorize(token: string | undefined): void {
    const expectedToken = this.configService.getOrThrow<string>(
      'CHECK_TRIGGER_TOKEN',
    );

    if (!this.tokensMatch(token, expectedToken)) {
      throw new UnauthorizedException('Invalid JobRadar trigger token');
    }
  }

  private tokensMatch(
    provided: string | undefined,
    expected: string,
  ): boolean {
    if (!provided) {
      return false;
    }

    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);

    return (
      providedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(providedBuffer, expectedBuffer)
    );
  }
}