import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';
import { TransactionDetail } from './transaction-detail.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionDetail)
    private readonly transactionDetailRepository: Repository<TransactionDetail>,
  ) {}

  async credit(amount: number, userId: string, type: string, metadata: any): Promise<Transaction> {
    if (amount <= 0) {
      throw new HttpException('Amount must be a positive number', HttpStatus.BAD_REQUEST);
    }

    let wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      wallet = this.walletRepository.create({
        userId,
        balance: 0,
        frozenBalance: 0,
      });
    }

    const balanceBefore = Number(wallet.balance);
    const newBalance = balanceBefore + Number(amount);
    wallet.balance = newBalance;

    const transaction = this.transactionRepository.create({
      wallet: wallet,
      userId,
      amount: Number(amount),
      balanceBefore,
      balanceAfter: newBalance,
      type,
      metadata,
      status: 'SUCCESS',
    });
    await this.transactionRepository.save(transaction);

    const transactionDetail = this.transactionDetailRepository.create({
      transaction: transaction,
      userId,
      amount: Number(amount),
      balanceBefore,
      balanceAfter: newBalance,
      type,
      metadata,
    });
    await this.transactionDetailRepository.save(transactionDetail);

    await this.walletRepository.save(wallet);

    return transaction;
  }

  async debit(amount: number, userId: string, type: string, metadata: any): Promise<Transaction> {
    if (amount <= 0) {
      throw new HttpException('Amount must be a positive number', HttpStatus.BAD_REQUEST);
    }

    const wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
    }

    const balanceBefore = Number(wallet.balance);

    if (balanceBefore < Number(amount)) {
      const failedTransaction = this.transactionRepository.create({
        wallet: wallet,
        userId,
        amount: Number(amount),
        balanceBefore,
        balanceAfter: balanceBefore, // Balance does not change
        type,
        metadata,
        status: 'FAILED',
      });
      await this.transactionRepository.save(failedTransaction);

      const failedTransactionDetail = this.transactionDetailRepository.create({
        transaction: failedTransaction,
        userId,
        amount: Number(amount),
        balanceBefore,
        balanceAfter: balanceBefore,
        type,
        metadata,
      });
      await this.transactionDetailRepository.save(failedTransactionDetail);

      throw new HttpException('Insufficient funds', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const newBalance = balanceBefore - Number(amount);
    wallet.balance = newBalance;

    const successTransaction = this.transactionRepository.create({
      wallet: wallet,
      userId,
      amount: Number(amount),
      balanceBefore,
      balanceAfter: newBalance,
      type,
      metadata,
      status: 'SUCCESS',
    });
    await this.transactionRepository.save(successTransaction);

    const successTransactionDetail = this.transactionDetailRepository.create({
      transaction: successTransaction,
      userId,
      amount: Number(amount),
      balanceBefore,
      balanceAfter: newBalance,
      type,
      metadata,
    });
    await this.transactionDetailRepository.save(successTransactionDetail);

    await this.walletRepository.save(wallet);

    return successTransaction;
  }

  async chargeFee(amount: number, userId: string, feeType: string, metadata: any): Promise<void> {
    // Implement fee charging logic
  }

  async applyReward(amount: number, userId: string, campaignId: string, metadata: any): Promise<void> {
    // Implement reward application logic
  }

  async getBalance(userId: string): Promise<{ availableBalance: number; frozenBalance: number }> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });

    if (wallet) {
      return {
        availableBalance: wallet.balance,
        frozenBalance: wallet.frozenBalance,
      };
    } else {
      return {
        availableBalance: 0,
        frozenBalance: 0,
      };
    }
  }

  async generateReport(userScope: string, period: string, filters: any): Promise<any> {
    // Implement report generation logic
  }

  async updateTransactionStatus(transactionId: string, status: string): Promise<void> {
    // Implement transaction status update logic
  }
}
