import { Test, TestingModule } from '@nestjs/testing';
import { ErrorFilter } from '../../../src/common/filters/error.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { Request, Response } from 'express';

describe('ErrorFilter', () => {
  let filter: ErrorFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErrorFilter],
    }).compile();

    filter = module.get<ErrorFilter>(ErrorFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    const host: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        }),
        getRequest: () => ({
          url: '/test',
        }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    const response = host.switchToHttp().getResponse<Response>();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Test error',
    });
  });

  it('should handle non-HttpException', () => {
    const exception = new Error('Test error');
    const host: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        }),
        getRequest: () => ({
          url: '/test',
        }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    const response = host.switchToHttp().getResponse<Response>();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/test',
      message: 'Test error',
    });
  });

  it('should trigger compensation or rollback', () => {
    const exception = new Error('Test error');
    const host: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        }),
        getRequest: () => ({
          url: '/test',
        }),
      }),
    } as unknown as ArgumentsHost;

    const triggerCompensationOrRollbackSpy = jest.spyOn(filter as any, 'triggerCompensationOrRollback');

    filter.catch(exception, host);

    expect(triggerCompensationOrRollbackSpy).toHaveBeenCalledWith(exception);
  });
});
