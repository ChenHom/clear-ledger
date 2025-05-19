import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from '../../src/wallet/wallet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wallet } from '../../src/wallet/wallet.entity';
import { Transaction } from '../../src/wallet/transaction.entity';
import { TransactionDetail } from '../../src/wallet/transaction-detail.entity';

describe('WalletService', () => {
  let service: WalletService;

  const mockWalletRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockTransactionRepository = {
    save: jest.fn(),
  };

  const mockTransactionDetailRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockWalletRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(TransactionDetail),
          useValue: mockTransactionDetailRepository,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('credit', () => {
    it('should credit the wallet', async () => {
      const userId = 'user-id';
      const amount = 100;
      const type = 'deposit';
      const metadata = {};

      mockWalletRepository.findOne.mockResolvedValue({
        id: 'wallet-id',
        userId,
        balance: 0,
        frozenBalance: 0,
      });

      await service.credit(amount, userId, type, metadata);

      expect(mockWalletRepository.save).toHaveBeenCalledWith({
        id: 'wallet-id',
        userId,
        balance: amount,
        frozenBalance: 0,
      });

      expect(mockTransactionRepository.save).toHaveBeenCalledWith({
        wallet: { id: 'wallet-id' },
        userId,
        amount,
        balanceBefore: 0,
        balanceAfter: amount,
        type,
        metadata,
        status: 'Success',
      });
    });
  });

  describe('debit', () => {
    it('should debit the wallet', async () => {
      const userId = 'user-id';
      const amount = 50;
      const type = 'withdrawal';
      const metadata = {};

      mockWalletRepository.findOne.mockResolvedValue({
        id: 'wallet-id',
        userId,
        balance: 100,
        frozenBalance: 0,
      });

      await service.debit(amount, userId, type, metadata);

      expect(mockWalletRepository.save).toHaveBeenCalledWith({
        id: 'wallet-id',
        userId,
        balance: 50,
        frozenBalance: 0,
      });

      expect(mockTransactionRepository.save).toHaveBeenCalledWith({
        wallet: { id: 'wallet-id' },
        userId,
        amount: -amount,
        balanceBefore: 100,
        balanceAfter: 50,
        type,
        metadata,
        status: 'Success',
      });
    });
  });

  describe('chargeFee', () => {
    it('should charge a fee', async () => {
      const userId = 'user-id';
      const amount = 10;
      const feeType = 'service';
      const metadata = {};

      mockWalletRepository.findOne.mockResolvedValue({
        id: 'wallet-id',
        userId,
        balance: 100,
        frozenBalance: 0,
      });

      await service.chargeFee(amount, userId, feeType, metadata);

      expect(mockWalletRepository.save).toHaveBeenCalledWith({
        id: 'wallet-id',
        userId,
        balance: 90,
        frozenBalance: 0,
      });

      expect(mockTransactionRepository.save).toHaveBeenCalledWith({
        wallet: { id: 'wallet-id' },
        userId,
        amount: -amount,
        balanceBefore: 100,
        balanceAfter: 90,
        type: feeType,
        metadata,
        status: 'Success',
      });
    });
  });

  describe('applyReward', () => {
    it('should apply a reward', async () => {
      const userId = 'user-id';
      const amount = 20;
      const campaignId = 'campaign-id';
      const metadata = {};

      mockWalletRepository.findOne.mockResolvedValue({
        id: 'wallet-id',
        userId,
        balance: 100,
        frozenBalance: 0,
      });

      await service.applyReward(amount, userId, campaignId, metadata);

      expect(mockWalletRepository.save).toHaveBeenCalledWith({
        id: 'wallet-id',
        userId,
        balance: 120,
        frozenBalance: 0,
      });

      expect(mockTransactionRepository.save).toHaveBeenCalledWith({
        wallet: { id: 'wallet-id' },
        userId,
        amount,
        balanceBefore: 100,
        balanceAfter: 120,
        type: 'reward',
        metadata,
        status: 'Success',
      });
    });
  });

  describe('getBalance', () => {
    it('should return the balance', async () => {
      const userId = 'user-id';

      mockWalletRepository.findOne.mockResolvedValue({
        id: 'wallet-id',
        userId,
        balance: 100,
        frozenBalance: 50,
      });

      const result = await service.getBalance(userId);

      expect(result).toEqual({
        availableBalance: 100,
        frozenBalance: 50,
      });
    });
  });

  describe('generateReport', () => {
    it('should generate a report', async () => {
      const userScope = 'all';
      const period = 'monthly';
      const filters = {};

      const result = await service.generateReport(userScope, period, filters);

      expect(result).toBeDefined();
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update the transaction status', async () => {
      const transactionId = 'transaction-id';
      const status = 'Success';

      await service.updateTransactionStatus(transactionId, status);

      expect(mockTransactionRepository.save).toHaveBeenCalledWith({
        id: transactionId,
        status,
      });
    });
  });
});
