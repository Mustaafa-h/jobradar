import { ConflictException, Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

export interface CheckResult {
  status: string;
  startedAt: string;
  completedAt: string;
}

@Injectable()
export class ChecksService {
  private running = false;

  async run(): Promise<CheckResult> {
    if (this.running) {
      throw new ConflictException('A JobRadar check is already running');
    }

    this.running = true;
    const startedAt = new Date();

    try {
      await this.executePipeline();

      return {
        status: 'completed',
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
      };
    } finally {
      this.running = false;
    }
  }

  private executePipeline(): Promise<void> {
    const scriptPath = resolve(
      process.cwd(),
      'dist/scripts/run-jobradar-check.js',
    );

    return new Promise((resolvePromise, rejectPromise) => {
      const child = spawn(process.execPath, [scriptPath], {
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (data: Buffer) => {
        process.stdout.write(data);
      });

      child.stderr.on('data', (data: Buffer) => {
        process.stderr.write(data);
      });

      child.once('error', rejectPromise);

      child.once('close', (exitCode) => {
        if (exitCode === 0) {
          resolvePromise();
          return;
        }

        rejectPromise(
          new Error(
            `JobRadar pipeline exited with code ${exitCode ?? 'unknown'}`,
          ),
        );
      });
    });
  }
}