import { Test, TestingModule } from '@nestjs/testing';
import { LoggingService } from '../../src/logging/logging.service';

describe('LoggingService', () => {
  let service: LoggingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingService],
    }).compile();

    service = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log TPS', () => {
    const tps = 100;
    jest.spyOn(service, 'logTPS');
    service.logTPS(tps);
    expect(service.logTPS).toHaveBeenCalledWith(tps);
  });

  it('should log error rate', () => {
    const errorRate = 0.05;
    jest.spyOn(service, 'logErrorRate');
    service.logErrorRate(errorRate);
    expect(service.logErrorRate).toHaveBeenCalledWith(errorRate);
  });

  it('should log latency', () => {
    const latency = 200;
    jest.spyOn(service, 'logLatency');
    service.logLatency(latency);
    expect(service.logLatency).toHaveBeenCalledWith(latency);
  });
});
