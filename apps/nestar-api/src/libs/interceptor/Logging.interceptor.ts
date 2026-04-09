import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const recordTime = Date.now();
    const type = context.getType();
    this.logger.log(`Type ${type}`, 'REQUEST');

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - recordTime;
        this.logger.log(`${responseTime}ms`, 'RESPONSE');
      }),
    );
  }
}