import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './wallet.entity';
import { Transaction } from './transaction.entity';
import { TransactionDetail } from './transaction-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Transaction, TransactionDetail])],
  providers: [WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
