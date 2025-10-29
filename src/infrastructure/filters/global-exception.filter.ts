import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error(exception.message, exception.stack);

    const status = exception.getStatus();
    const res = exception.getResponse();

    const message =
      typeof res === 'string' ? res : (res as Record<string, any>).message || 'Error desconocido';
    const error = (res as Record<string, any>).error || exception.name;

    response.status(status).json({
      ok: false,
      message,
      statusCode: status,
      error,
      path: request.url,
    });
  }
}
