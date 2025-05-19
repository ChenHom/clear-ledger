import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreditDto, DebitDto, FeeDto, RewardDto, BalanceDto, ReportDto, TransactionStatusDto } from './wallet.dto';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('credit')
  @ApiOperation({ summary: 'Credit amount to wallet' })
  @ApiResponse({ status: 201, description: 'Amount credited successfully.' })
  async credit(@Body() creditDto: CreditDto): Promise<void> {
    const { amount, userId, type, metadata } = creditDto;
    await this.walletService.credit(amount, userId, type, metadata);
  }

  @Post('debit')
  @ApiOperation({ summary: 'Debit amount from wallet' })
  @ApiResponse({ status: 201, description: 'Amount debited successfully.' })
  async debit(@Body() debitDto: DebitDto): Promise<void> {
    const { amount, userId, type, metadata } = debitDto;
    await this.walletService.debit(amount, userId, type, metadata);
  }

  @Post('fee')
  @ApiOperation({ summary: 'Charge fee to wallet' })
  @ApiResponse({ status: 201, description: 'Fee charged successfully.' })
  async chargeFee(@Body() feeDto: FeeDto): Promise<void> {
    const { amount, userId, feeType, metadata } = feeDto;
    await this.walletService.chargeFee(amount, userId, feeType, metadata);
  }

  @Post('reward')
  @ApiOperation({ summary: 'Apply reward to wallet' })
  @ApiResponse({ status: 201, description: 'Reward applied successfully.' })
  async applyReward(@Body() rewardDto: RewardDto): Promise<void> {
    const { amount, userId, campaignId, metadata } = rewardDto;
    await this.walletService.applyReward(amount, userId, campaignId, metadata);
  }

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully.' })
  async getBalance(@Param('userId') userId: string): Promise<BalanceDto> {
    return await this.walletService.getBalance(userId);
  }

  @Post('report')
  @ApiOperation({ summary: 'Generate report' })
  @ApiResponse({ status: 201, description: 'Report generated successfully.' })
  async generateReport(@Body() reportDto: ReportDto): Promise<any> {
    const { userScope, period, filters } = reportDto;
    return await this.walletService.generateReport(userScope, period, filters);
  }

  @Patch('transaction-status')
  @ApiOperation({ summary: 'Update transaction status' })
  @ApiResponse({ status: 200, description: 'Transaction status updated successfully.' })
  async updateTransactionStatus(@Body() transactionStatusDto: TransactionStatusDto): Promise<void> {
    const { transactionId, status } = transactionStatusDto;
    await this.walletService.updateTransactionStatus(transactionId, status);
  }
}
