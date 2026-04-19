import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type HttpExceptionResponse =
  | string
  | {
      message?: string | string[];
      error?: string;
      statusCode?: number;
    };

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException
        ? (exception.getResponse() as HttpExceptionResponse)
        : undefined;

    response.status(statusCode).json({
      statusCode,
      error: this.resolveError(exception, exceptionResponse, statusCode),
      message: this.resolveMessage(exception, exceptionResponse, statusCode),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveError(
    exception: unknown,
    exceptionResponse: HttpExceptionResponse | undefined,
    statusCode: number,
  ) {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      exceptionResponse.error
    ) {
      return exceptionResponse.error;
    }

    if (exception instanceof HttpException) {
      return exception.name;
    }

    return statusCode === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'InternalServerError'
      : 'Error';
  }

  private resolveMessage(
    exception: unknown,
    exceptionResponse: HttpExceptionResponse | undefined,
    statusCode: number,
  ) {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      exceptionResponse.message
    ) {
      return exceptionResponse.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return statusCode === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'An unexpected error occurred.'
      : 'Request failed.';
  }
}
