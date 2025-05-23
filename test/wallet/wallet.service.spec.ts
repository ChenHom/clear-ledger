import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from '../../src/wallet/wallet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wallet } from '../../src/wallet/wallet.entity';
import { Transaction } from '../../src/wallet/transaction.entity';
import { TransactionDetail } from '../../src/wallet/transaction-detail.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;

  const mockWalletRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTransactionDetailRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks(); // Clear mocks before each test

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

  describe('getBalance', () => {
    it('should return the available and frozen balance for an existing wallet', async () => {
      const userId = 'test-user';
      const mockWallet = {
        id: 'wallet-id',
        userId,
        balance: 100,
        frozenBalance: 50,
        transactions: [],
      };
      mockWalletRepository.findOne.mockResolvedValue(mockWallet);

      const result = await service.getBalance(userId);

      expect(mockWalletRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toEqual({
        availableBalance: 100,
        frozenBalance: 50,
      });
    });

    it('should return zero balances if wallet not found', async () => {
      const userId = 'non-existent-user';
      mockWalletRepository.findOne.mockResolvedValue(null);

      const result = await service.getBalance(userId);

      expect(mockWalletRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toEqual({
        availableBalance: 0,
        frozenBalance: 0,
      });
    });
  });

  describe('credit', () => {
    const userId = 'user-id';
    const creditAmount = 100;
    const type = 'deposit';
    const metadata = { info: 'test deposit' };

    it('should credit an existing wallet', async () => {
      const initialBalance = 50;
      const mockExistingWallet = {
        id: 'wallet-id',
        userId,
        balance: initialBalance,
        frozenBalance: 0,
        transactions: [],
      };
      const mockTransaction = {
        id: 'trans-id-1',
        wallet: mockExistingWallet,
        userId,
        amount: creditAmount,
        balanceBefore: initialBalance,
        balanceAfter: initialBalance + creditAmount,
        type,
        metadata,
        status: 'SUCCESS',
        createdAt: new Date(),
        transactionDetails: [],
      };
      const mockTransactionDetail = {
        id: 'detail-id-1',
        transaction: mockTransaction,
        userId,
        amount: creditAmount,
        balanceBefore: initialBalance,
        balanceAfter: initialBalance + creditAmount,
        type,
        metadata,
        createdAt: new Date(),
      };

      mockWalletRepository.findOne.mockResolvedValue(mockExistingWallet);
      // Mock the .create methods used by the service
      mockTransactionRepository.create.mockImplementation(dto => dto);
      mockTransactionDetailRepository.create.mockImplementation(dto => dto);
      // Mock the .save methods to return the created entities
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);
      mockTransactionDetailRepository.save.mockResolvedValue(mockTransactionDetail);
      mockWalletRepository.save.mockResolvedValue({ ...mockExistingWallet, balance: initialBalance + creditAmount });


      const result = await service.credit(creditAmount, userId, type, metadata);

      expect(mockWalletRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      
      expect(mockTransactionRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        wallet: mockExistingWallet,
        userId,
        amount: creditAmount,
        balanceBefore: initialBalance,
        balanceAfter: initialBalance + creditAmount,
        type,
        metadata,
        status: 'SUCCESS',
      }));
      expect(mockTransactionRepository.save).toHaveBeenCalled();
      
      expect(mockTransactionDetailRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        transaction: mockTransaction,
        userId,
        amount: creditAmount,
        balanceBefore: initialBalance,
        balanceAfter: initialBalance + creditAmount,
        type,
        metadata,
      }));
      expect(mockTransactionDetailRepository.save).toHaveBeenCalled();

      expect(mockWalletRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'wallet-id',
          balance: initialBalance + creditAmount,
        }),
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should create a new wallet and credit it if wallet does not exist', async () => {
      const newUserId = 'new-user-id';
      const initialCreditAmount = 100;
      const mockNewWallet = {
        id: 'new-wallet-id',
        userId: newUserId,
        balance: 0, // Initial balance before credit
        frozenBalance: 0,
        transactions: [],
      };
      const mockCreditedWallet = {
        ...mockNewWallet,
        balance: initialCreditAmount, // Balance after credit
      };
      const mockTransaction = {
        id: 'trans-id-2',
        wallet: mockCreditedWallet, // Should be linked to the wallet state *after* credit logic
        userId: newUserId,
        amount: initialCreditAmount,
        balanceBefore: 0,
        balanceAfter: initialCreditAmount,
        type: 'initial_deposit',
        metadata: {},
        status: 'SUCCESS',
        createdAt: new Date(),
        transactionDetails: [],
      };
       const mockTransactionDetail = {
        id: 'detail-id-2',
        transaction: mockTransaction,
        userId: newUserId,
        amount: initialCreditAmount,
        balanceBefore: 0,
        balanceAfter: initialCreditAmount,
        type: 'initial_deposit',
        metadata: {},
        createdAt: new Date(),
      };

      mockWalletRepository.findOne.mockResolvedValue(null);
      mockWalletRepository.create.mockReturnValue(mockNewWallet); // Mock create for new wallet
      
      // Mock the .create methods used by the service
      mockTransactionRepository.create.mockImplementation(dto => dto);
      mockTransactionDetailRepository.create.mockImplementation(dto => dto);

      mockTransactionRepository.save.mockResolvedValue(mockTransaction);
      mockTransactionDetailRepository.save.mockResolvedValue(mockTransactionDetail);
      mockWalletRepository.save.mockResolvedValue(mockCreditedWallet); // Wallet save returns the credited wallet

      const result = await service.credit(initialCreditAmount, newUserId, 'initial_deposit', {});

      expect(mockWalletRepository.findOne).toHaveBeenCalledWith({ where: { userId: newUserId } });
      expect(mockWalletRepository.create).toHaveBeenCalledWith({
        userId: newUserId,
        balance: 0,
        frozenBalance: 0,
      });
      
      expect(mockTransactionRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        // wallet field here will be the object created by walletRepository.create
        // and its balance property will be updated before this by the service
        wallet: expect.objectContaining({ userId: newUserId, balance: initialCreditAmount }), 
        userId: newUserId,
        amount: initialCreditAmount,
        balanceBefore: 0,
        balanceAfter: initialCreditAmount,
        status: 'SUCCESS',
      }));
      expect(mockTransactionRepository.save).toHaveBeenCalled();

      expect(mockTransactionDetailRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        transaction: mockTransaction,
        userId: newUserId,
        amount: initialCreditAmount,
        balanceBefore: 0,
        balanceAfter: initialCreditAmount,
      }));
      expect(mockTransactionDetailRepository.save).toHaveBeenCalled();
      
      expect(mockWalletRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: newUserId, balance: initialCreditAmount }),
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should throw BadRequestException for non-positive credit amount (0)', async () => {
      await expect(service.credit(0, userId, type, metadata)).rejects.toThrow(
        new HttpException('Amount must be a positive number', HttpStatus.BAD_REQUEST),
      );
      expect(mockWalletRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionDetailRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-positive credit amount (-10)', async () => {
      await expect(service.credit(-10, userId, type, metadata)).rejects.toThrow(
        new HttpException('Amount must be a positive number', HttpStatus.BAD_REQUEST),
      );
      expect(mockWalletRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionDetailRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('debit', () => {
    const userId = 'user-id';
    const debitAmount = 50;
    const type = 'withdrawal';
    const metadata = { info: 'test withdrawal' };

    it('should debit an existing wallet with sufficient funds', async () => {
      const initialBalance = 200;
      const mockExistingWallet = {
        id: 'wallet-id',
        userId,
        balance: initialBalance,
        frozenBalance: 0,
        transactions: [],
      };
       const mockTransaction = {
        id: 'trans-id-3',
        wallet: mockExistingWallet,
        userId,
        amount: debitAmount,
        balanceBefore: initialBalance,
        balanceAfter: initialBalance - debitAmount,
        type,
        metadata,
        status: 'SUCCESS',
        createdAt: new Date(),
        transactionDetails: [],
      };
      const mockTransactionDetail = {
        id: 'detail-id-3',
        transaction: mockTransaction,
        userId,
        amount: debitAmount,
        balanceBefore: initialBalance,
        balanceAfter: initialBalance - debitAmount,
        type,
        metadata,
        createdAt: new Date(),
      };

      mockWalletRepository.findOne.mockResolvedValue(mockExistingWallet);
      mockTransactionRepository.create.mockImplementation(dto => dto);
      mockTransactionDetailRepository.create.mockImplementation(dto => dto);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);
      mockTransactionDetailRepository.save.mockResolvedValue(mockTransactionDetail);
      mockWalletRepository.save.mockResolvedValue({ ...mockExistingWallet, balance: initialBalance - debitAmount });

      const result = await service.debit(debitAmount, userId, type, metadata);

      expect(mockWalletRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(mockWalletRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'wallet-id', balance: initialBalance - debitAmount }),
      );
      expect(mockTransactionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          amount: debitAmount,
          balanceBefore: initialBalance,
          balanceAfter: initialBalance - debitAmount,
        }),
      );
      expect(mockTransactionDetailRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if wallet not found for debit', async () => {
      mockWalletRepository.findOne.mockResolvedValue(null);

      await expect(service.debit(debitAmount, 'non-existent-user', type, metadata)).rejects.toThrow(
        new HttpException('Wallet not found', HttpStatus.NOT_FOUND),
      );
      expect(mockWalletRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionDetailRepository.save).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException and log FAILED transaction for insufficient funds', async () => {
      const initialBalance = 30; // Insufficient funds
      const mockExistingWallet = {
        id: 'wallet-id',
        userId,
        balance: initialBalance,
        frozenBalance: 0,
        transactions: [],
      };
      const mockFailedTransaction = {
        id: 'trans-id-failed',
        wallet: mockExistingWallet,
        userId,
        amount: debitAmount, // 50
        balanceBefore: initialBalance, // 30
        balanceAfter: initialBalance, // 30
        type,
        metadata,
        status: 'FAILED',
        createdAt: new Date(),
        transactionDetails: [],
      };
      const mockFailedTransactionDetail = {
        id: 'detail-id-failed',
        transaction: mockFailedTransaction,
        userId,
        amount: debitAmount,
        balanceBefore: initialBalance,
        balanceAfter: initialBalance,
        type,
        metadata,
        createdAt: new Date(),
      };


      mockWalletRepository.findOne.mockResolvedValue(mockExistingWallet);
      mockTransactionRepository.create.mockImplementation(dto => dto);
      mockTransactionDetailRepository.create.mockImplementation(dto => dto);
      mockTransactionRepository.save.mockResolvedValue(mockFailedTransaction);
      mockTransactionDetailRepository.save.mockResolvedValue(mockFailedTransactionDetail);


      await expect(service.debit(debitAmount, userId, type, metadata)).rejects.toThrow(
        new HttpException('Insufficient funds', HttpStatus.UNPROCESSABLE_ENTITY),
      );

      expect(mockWalletRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(mockTransactionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          amount: debitAmount,
          balanceBefore: initialBalance,
          balanceAfter: initialBalance, // Balance remains unchanged
        }),
      );
      expect(mockTransactionDetailRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
            transaction: mockFailedTransaction, // Ensure detail is linked to the failed transaction
            amount: debitAmount,
            balanceBefore: initialBalance,
            balanceAfter: initialBalance,
        })
      );
      // Wallet balance should not change, so no save on wallet repo after failed debit
      expect(mockWalletRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-positive debit amount (0)', async () => {
      await expect(service.debit(0, userId, type, metadata)).rejects.toThrow(
        new HttpException('Amount must be a positive number', HttpStatus.BAD_REQUEST),
      );
      expect(mockWalletRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionDetailRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-positive debit amount (-50)', async () => {
      await expect(service.debit(-50, userId, type, metadata)).rejects.toThrow(
        new HttpException('Amount must be a positive number', HttpStatus.BAD_REQUEST),
      );
      expect(mockWalletRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionDetailRepository.save).not.toHaveBeenCalled();
    });
  });

  // --- Keep other describe blocks as they are ---
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
      // Added create mocks for consistency, though original test didn't strictly need them if not checking DTOs
      mockTransactionRepository.create.mockImplementation(dto => dto);


      await service.chargeFee(amount, userId, feeType, metadata);

      expect(mockWalletRepository.save).toHaveBeenCalledWith({
        id: 'wallet-id',
        userId,
        balance: 90, // Assuming chargeFee deducts
        frozenBalance: 0,
      });

      // Original test checked for amount: -amount. Assuming chargeFee internally handles this.
      // If chargeFee is similar to debit, this might need adjustment based on its actual implementation.
      // For now, keeping it as per original test structure.
      expect(mockTransactionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      // wallet: { id: 'wallet-id' }, // wallet field is an object in service
        userId,
        amount: -amount, // This was in original test, implies fee is stored as negative
        balanceBefore: 100,
        balanceAfter: 90,
        type: feeType,
        metadata,
        status: 'Success', // Assuming Success
      }));
    });
  });

  describe('applyReward', () => {
    it('should apply a reward', async () => {
      const userId = 'user-id';
      const amount = 20;
      const campaignId = 'campaign-id'; // Used as type in original test
      const metadata = {};

      mockWalletRepository.findOne.mockResolvedValue({
        id: 'wallet-id',
        userId,
        balance: 100,
        frozenBalance: 0,
      });
      mockTransactionRepository.create.mockImplementation(dto => dto);


      await service.applyReward(amount, userId, campaignId, metadata);

      expect(mockWalletRepository.save).toHaveBeenCalledWith({
        id: 'wallet-id',
        userId,
        balance: 120,
        frozenBalance: 0,
      });

      expect(mockTransactionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        // wallet: { id: 'wallet-id' },
        userId,
        amount,
        balanceBefore: 100,
        balanceAfter: 120,
        type: 'reward', // Assuming type is 'reward'
        metadata, // campaignId might be part of metadata or a specific field
        status: 'Success',
      }));
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
