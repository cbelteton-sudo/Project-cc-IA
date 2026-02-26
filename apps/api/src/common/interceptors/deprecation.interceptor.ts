import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { DEPRECATED_KEY } from '../decorators/deprecated.decorator';

@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const replacementRoute = this.reflector.getAllAndOverride<string>(
      DEPRECATED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (replacementRoute) {
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-Deprecated', 'true');
      response.setHeader('X-Replacement-Endpoint', replacementRoute);
    }

    return next.handle();
  }
}
