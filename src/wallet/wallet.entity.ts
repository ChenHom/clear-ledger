import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: '用戶ID' })
  userId: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0, comment: '餘額' })
  balance: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, comment: '凍結餘額' })
  frozenBalance: number;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  wallet: Wallet;

  @Column({ comment: '用戶ID' })
  userId: string;

  @Column('decimal', { precision: 10, scale: 2, comment: '交易金額' })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '交易前餘額' })
  balanceBefore: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '交易後餘額' })
  balanceAfter: number;

  @Column({ comment: '交易類型' })
  type: string;

  @Column('json', { nullable: true, comment: '附加數據' })
  metadata: any;

  @Column({ comment: '交易狀態' })
  status: string;

  @CreateDateColumn({ comment: '創建時間' })
  createdAt: Date;

  @OneToMany(() => TransactionDetail, (transactionDetail) => transactionDetail.transaction)
  transactionDetails: TransactionDetail[];
}

@Entity('transaction_details')
export class TransactionDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.transactionDetails)
  transaction: Transaction;

  @Column({ comment: '用戶ID' })
  userId: string;

  @Column('decimal', { precision: 10, scale: 2, comment: '交易金額' })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '交易前餘額' })
  balanceBefore: number;

  @Column('decimal', { precision: 10, scale: 2, comment: '交易後餘額' })
  balanceAfter: number;

  @Column({ comment: '交易類型' })
  type: string;

  @Column('json', { nullable: true, comment: '附加數據' })
  metadata: any;

  @CreateDateColumn({ comment: '創建時間' })
  createdAt: Date;
}
