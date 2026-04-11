import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable() // Bu dekorator class’ni NestJS ichida DI (Dependency Injection) orqali ishlatish imkonini beradi
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(); // Logger NestJS’ning ichki loglash vositasi

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const recordTime = Date.now(); // So‘rov boshlanish vaqtini olish
    const requestType = context.getType<GqlContextType>(); // So‘rov turi: http yoki graphql

    if (requestType === 'http') {
      // HTTP so‘rovlar uchun log yozish joyi (hozircha bo‘sh)
       return next.handle();

    } else if (requestType === 'graphql') {
      /** (1) GraphQL Request’ni log qilish **/
      const gqlContext = GqlExecutionContext.create(context); // GraphQL context yaratish
      this.logger.log(`${this.stringify(gqlContext.getContext().req.body)}`, 'REQUEST'); 
      // GraphQL request body’ni logga chiqarish

      /** (2) GraphQL Errors handling joyi (keyinchalik yozilishi mumkin) **/

      /** (3) Agar xato bo‘lmasa, Response log qilish **/
      return next.handle().pipe(
        tap((context) => {
          const responseTime = Date.now() - recordTime; // Javob uchun ketgan vaqtni hisoblash
          this.logger.log(`${this.stringify(context)} - ${responseTime}ms \n\n`, 'RESPONSE'); 
          // Javobni va vaqtni logga chiqarish
        }),
      );
    }
      return next.handle();

  }

  private stringify(context: ExecutionContext): string {
    return JSON.stringify(context).slice(0, 75); 
    // Context’ni JSON stringga aylantirib, faqat birinchi 75 belgini olish
    // Bu loglarni haddan tashqari uzun bo‘lishidan saqlaydi
  }
}