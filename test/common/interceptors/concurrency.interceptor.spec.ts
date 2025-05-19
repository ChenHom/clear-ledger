import { Test, TestingModule } from '@nestjs/testing';
import { ConcurrencyInterceptor } from '../../../src/common/interceptors/concurrency.interceptor';
import { Wallet } from '../../../src/wallet/wallet.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { of } from 'rxjs';

describe('ConcurrencyInterceptor', () => {
  let interceptor: ConcurrencyInterceptor;
  let walletRepository: Repository<Wallet>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcurrencyInterceptor,
        {
          provide: getRepositoryToken(Wallet),
          useClass: Repository,
        },
      ],
    }).compile();

    interceptor = module.get<ConcurrencyInterceptor>(ConcurrencyInterceptor);
    walletRepository = module.get<Repository<Wallet>>(getRepositoryToken(Wallet));
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should throw ConflictException if wallet is not found', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          body: {
            userId: 'test-user-id',
          },
        }),
      }),
    };

    jest.spyOn(walletRepository, 'findOne').mockResolvedValueOnce(null);

    try {
      await interceptor.intercept(context, {
        handle: () => of(null),
      }).toPromise();
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.message).toBe('Wallet not found');
    }
  });

  it('should commit transaction if wallet is found', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          body: {
            userId: 'test-user-id',
          },
        }),
      }),
    };

    const wallet = new Wallet();
    jest.spyOn(walletRepository, 'findOne').mockResolvedValueOnce(wallet);
    const commitTransactionSpy = jest.fn();
    const rollbackTransactionSpy = jest.fn();
    const releaseSpy = jest.fn();

    const queryRunner: any = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        findOne: jest.fn().mockResolvedValueOnce(wallet),
      },
      commitTransaction: commitTransactionSpy,
      rollbackTransaction: rollbackTransactionSpy,
      release: releaseSpy,
    };

    jest.spyOn(walletRepository.manager.connection, 'createQueryRunner').mockReturnValue(queryRunner);

    await interceptor.intercept(context, {
      handle: () => of(null),
    }).toPromise();

    expect(commitTransactionSpy).toHaveBeenCalled();
    expect(rollbackTransactionSpy).not.toHaveBeenCalled();
    expect(releaseSpy).toHaveBeenCalled();
  });

  it('should rollback transaction if an error occurs', async () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          body: {
            userId: 'test-user-id',
          },
        }),
      }),
    };

    const wallet = new Wallet();
    jest.spyOn(walletRepository, 'findOne').mockResolvedValueOnce(wallet);
    const commitTransactionSpy = jest.fn();
    const rollbackTransactionSpy = jest.fn();
    const releaseSpy = jest.fn();

    const queryRunner: any = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        findOne: jest.fn().mockResolvedValueOnce(wallet),
      },
      commitTransaction: commitTransactionSpy,
      rollbackTransaction: rollbackTransactionSpy,
      release: releaseSpy,
    };

    jest.spyOn(walletRepository.manager.connection, 'createQueryRunner').mockReturnValue(queryRunner);

    jest.spyOn(queryRunner.manager, 'findOne').mockRejectedValueOnce(new Error('Test error'));

    try {
      await interceptor.intercept(context, {
        handle: () => of(null),
      }).toPromise();
    } catch (error) {
      expect(error.message).toBe('Test error');
    }

    expect(commitTransactionSpy).not.toHaveBeenCalled();
    expect(rollbackTransactionSpy).toHaveBeenCalled();
    expect(releaseSpy).toHaveBeenCalled();
  });
});
