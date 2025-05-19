import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from '../../src/wallet/wallet.controller';
import { WalletService } from '../../src/wallet/wallet.service';
import { CreditDto, DebitDto, FeeDto, RewardDto, ReportDto, TransactionStatusDto } from '../../src/wallet/wallet.dto';

describe('WalletController', () => {
  let walletController: WalletController;
  let walletService: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: {
            credit: jest.fn(),
            debit: jest.fn(),
            chargeFee: jest.fn(),
            applyReward: jest.fn(),
            getBalance: jest.fn(),
            generateReport: jest.fn(),
            updateTransactionStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    walletController = module.get<WalletController>(WalletController);
    walletService = module.get<WalletService>(WalletService);
  });

  describe('credit', () => {
    it('should credit amount to wallet', async () => {
      const creditDto: CreditDto = { amount: 100, userId: 'user1', type: 'deposit', metadata: {} };
      await walletController.credit(creditDto);
      expect(walletService.credit).toHaveBeenCalledWith(100, 'user1', 'deposit', {});
    });
  });

  describe('debit', () => {
    it('should debit amount from wallet', async () => {
      const debitDto: DebitDto = { amount: 50, userId: 'user1', type: 'withdrawal', metadata: {} };
      await walletController.debit(debitDto);
      expect(walletService.debit).toHaveBeenCalledWith(50, 'user1', 'withdrawal', {});
    });
  });

  describe('chargeFee', () => {
    it('should charge fee to wallet', async () => {
      const feeDto: FeeDto = { amount: 10, userId: 'user1', feeType: 'service', metadata: {} };
      await walletController.chargeFee(feeDto);
      expect(walletService.chargeFee).toHaveBeenCalledWith(10, 'user1', 'service', {});
    });
  });

  describe('applyReward', () => {
    it('should apply reward to wallet', async () => {
      const rewardDto: RewardDto = { amount: 20, userId: 'user1', campaignId: 'campaign1', metadata: {} };
      await walletController.applyReward(rewardDto);
      expect(walletService.applyReward).toHaveBeenCalledWith(20, 'user1', 'campaign1', {});
    });
  });

  describe('getBalance', () => {
    it('should get wallet balance', async () => {
      const balance = { availableBalance: 100, frozenBalance: 50 };
      jest.spyOn(walletService, 'getBalance').mockResolvedValue(balance);
      const result = await walletController.getBalance('user1');
      expect(result).toEqual(balance);
      expect(walletService.getBalance).toHaveBeenCalledWith('user1');
    });
  });

  describe('generateReport', () => {
    it('should generate report', async () => {
      const reportDto: ReportDto = { userScope: 'all', period: 'monthly', filters: {} };
      const report = { data: 'report data' };
      jest.spyOn(walletService, 'generateReport').mockResolvedValue(report);
      const result = await walletController.generateReport(reportDto);
      expect(result).toEqual(report);
      expect(walletService.generateReport).toHaveBeenCalledWith('all', 'monthly', {});
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status', async () => {
      const transactionStatusDto: TransactionStatusDto = { transactionId: 'txn1', status: 'Success' };
      await walletController.updateTransactionStatus(transactionStatusDto);
      expect(walletService.updateTransactionStatus).toHaveBeenCalledWith('txn1', 'Success');
    });
  });
});
