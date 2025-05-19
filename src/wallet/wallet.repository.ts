import { EntityRepository, Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';
import { TransactionDetail } from './transaction-detail.entity';

@EntityRepository(Wallet)
export class WalletRepository extends Repository<Wallet> {
  async findByUserId(userId: string): Promise<Wallet> {
    return this.findOne({ where: { userId } });
  }

  async updateBalance(userId: string, amount: number): Promise<void> {
    await this.createQueryBuilder()
      .update(Wallet)
      .set({ balance: () => `balance + ${amount}` })
      .where('userId = :userId', { userId })
      .execute();
  }

  async updateFrozenBalance(userId: string, amount: number): Promise<void> {
    await this.createQueryBuilder()
      .update(Wallet)
      .set({ frozenBalance: () => `frozenBalance + ${amount}` })
      .where('userId = :userId', { userId })
      .execute();
  }
}

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction> {
  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.find({ where: { userId } });
  }

  async updateStatus(transactionId: string, status: string): Promise<void> {
    await this.createQueryBuilder()
      .update(Transaction)
      .set({ status })
      .where('id = :transactionId', { transactionId })
      .execute();
  }
}

@EntityRepository(TransactionDetail)
export class TransactionDetailRepository extends Repository<TransactionDetail> {
  async findByTransactionId(transactionId: string): Promise<TransactionDetail[]> {
    return this.find({ where: { transaction: { id: transactionId } } });
  }
}
