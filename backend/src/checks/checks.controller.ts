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
@Controller('checks')
export class ChecksController {
  constructor(
    private readonly checksService: ChecksService,
    private readonly configService: ConfigService,
  ) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async run(
  @Headers('x-jobradar-token') token?: string,
): Promise<CheckResult> {
    const expectedToken = this.configService.getOrThrow<string>(
      'CHECK_TRIGGER_TOKEN',
    );

    if (!this.tokensMatch(token, expectedToken)) {
      throw new UnauthorizedException('Invalid JobRadar trigger token');
    }

    return this.checksService.run();
  }

  private tokensMatch(provided: string | undefined, expected: string): boolean {
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