import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreditDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class DebitDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class FeeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  feeType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class RewardDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  campaignId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class BalanceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  availableBalance: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  frozenBalance: number;
}

export class ReportDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userScope: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  period: string;

  @ApiProperty({ required: false })
  @IsOptional()
  filters?: any;
}

export class TransactionStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  transactionId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(['Pending', 'Success', 'Failed', 'Cancelled'])
  status: string;
}
