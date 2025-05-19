import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  logTPS(tps: number): void {
    this.logger.log(`TPS: ${tps}`);
  }

  logErrorRate(errorRate: number): void {
    this.logger.log(`Error Rate: ${errorRate}`);
  }

  logLatency(latency: number): void {
    this.logger.log(`Latency: ${latency}ms`);
  }
}
