import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../wallet/transaction.entity';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      throw new ConflictException('Idempotency key is required');
    }

    const existingTransaction = await this.transactionRepository.findOne({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      throw new ConflictException('Duplicate request');
    }

    return next.handle().pipe(
      tap(async () => {
        const transaction = new Transaction();
        transaction.idempotencyKey = idempotencyKey;
        await this.transactionRepository.save(transaction);
      }),
    );
  }
}
