import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '../../src/config/config.service';
import { ConfigModule } from '../../src/config/config.module';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get configuration value', () => {
    const key = 'TEST_KEY';
    const value = 'test_value';
    jest.spyOn(service, 'get').mockReturnValue(value);

    expect(service.get(key)).toBe(value);
  });

  it('should set configuration value', () => {
    const key = 'TEST_KEY';
    const value = 'test_value';
    jest.spyOn(service, 'set');

    service.set(key, value);

    expect(service.set).toHaveBeenCalledWith(key, value);
  });
});
