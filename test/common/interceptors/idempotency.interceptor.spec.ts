import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyInterceptor } from '../../../src/common/interceptors/idempotency.interceptor';
import { Transaction } from '../../../src/wallet/transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { of } from 'rxjs';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;
  let transactionRepository: Repository<Transaction>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyInterceptor,
        {
          provide: getRepositoryToken(Transaction),
          useClass: Repository,
        },
      ],
    }).compile();

    interceptor = module.get<IdempotencyInterceptor>(IdempotencyInterceptor);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should throw ConflictException if idempotency key is missing', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    };

    try {
      await interceptor.intercept(context, {
        handle: () => of(null),
      }).toPromise();
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.message).toBe('Idempotency key is required');
    }
  });

  it('should throw ConflictException if duplicate request is detected', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'idempotency-key': 'test-key',
          },
        }),
      }),
    };

    jest.spyOn(transactionRepository, 'findOne').mockResolvedValueOnce(new Transaction());

    try {
      await interceptor.intercept(context, {
        handle: () => of(null),
      }).toPromise();
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.message).toBe('Duplicate request');
    }
  });

  it('should save transaction if idempotency key is valid', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'idempotency-key': 'test-key',
          },
        }),
      }),
    };

    jest.spyOn(transactionRepository, 'findOne').mockResolvedValueOnce(null);
    const saveSpy = jest.spyOn(transactionRepository, 'save').mockResolvedValueOnce(new Transaction());

    await interceptor.intercept(context, {
      handle: () => of(null),
    }).toPromise();

    expect(saveSpy).toHaveBeenCalled();
  });
});
