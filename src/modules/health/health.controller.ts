import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthStatusModel } from '../../common/openapi/api-models';
import { HealthService, HealthStatus } from './health.service';

/**
 * Endpoint público de health check (liveness + readiness de la DB).
 *
 * Pensado para monitoreo y load balancers. Es intencionalmente público:
 * NO agregar guards de autenticación.
 */
@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API and database health' })
  @ApiOkResponse({ type: HealthStatusModel })
  public check(): Promise<HealthStatus> {
    return this.healthService.check();
  }
}
