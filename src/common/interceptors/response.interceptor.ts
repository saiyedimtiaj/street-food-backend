import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map((data: any) => {
        const statusCode = response.statusCode;
        const message = data?.message;
        const payload = message && typeof data === 'object' ? data.data ?? data : data;

        // If the handler returned { message, data } shape, extract them
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'data' in data
        ) {
          return {
            success: true,
            statusCode,
            message: data.message,
            data: data.data,
          };
        }

        return {
          success: true,
          statusCode,
          data: payload,
        };
      }),
    );
  }
}
