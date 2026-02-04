import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user } = request;

        return next.handle().pipe(
            tap(async () => {
                if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                    try {
                        await this.prisma.auditLog.create({
                            data: {
                                action: method,
                                entity: url, // Simplified entity name extraction
                                entityId: 'N/A', // Difficult to get generic ID without response parsing
                                userId: user?.userId,
                                tenantId: user?.tenantId || 'GLOBAL', // Fallback
                            }
                        });
                    } catch (e) {
                        console.error('Audit Log Error', e);
                    }
                }
            }),
        );
    }
}
