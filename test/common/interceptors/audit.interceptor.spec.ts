import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from '../../../src/common/interceptors/audit.interceptor';
import { AuditLog } from '../../../src/audit/audit-log.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { of } from 'rxjs';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditLogRepository: Repository<AuditLog>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        {
          provide: getRepositoryToken(AuditLog),
          useClass: Repository,
        },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should save audit log on successful request', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/test',
          body: { key: 'value' },
          user: { id: 'test-user' },
        }),
      }),
    };

    const saveSpy = jest.spyOn(auditLogRepository, 'save').mockResolvedValueOnce(new AuditLog());

    await interceptor.intercept(context, {
      handle: () => of({ success: true }),
    }).toPromise();

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should save audit log on failed request', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/test',
          body: { key: 'value' },
          user: { id: 'test-user' },
        }),
      }),
    };

    const saveSpy = jest.spyOn(auditLogRepository, 'save').mockResolvedValueOnce(new AuditLog());

    try {
      await interceptor.intercept(context, {
        handle: () => {
          throw new Error('Test error');
        },
      }).toPromise();
    } catch (error) {
      expect(saveSpy).toHaveBeenCalled();
    }
  });
});
