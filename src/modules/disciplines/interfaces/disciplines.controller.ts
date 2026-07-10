import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DomainExceptionFilter } from '../../../common/errors/domain-exception.filter';
import { DisciplineModel } from '../../../common/openapi/api-models';
import { ACCESS_TOKEN_SECURITY } from '../../../config/openapi.config';
import { JwtAuthGuard } from '../../auth/interfaces/jwt-auth.guard';
import { ListDisciplinesUseCase } from '../application/list-disciplines.use-case';
import { DisciplineView } from './discipline.view';

/** Catálogo global de disciplinas: no está scoped a un gym, cualquier usuario autenticado lo lee. */
@Controller('disciplines')
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@ApiTags('Disciplines')
@ApiCookieAuth(ACCESS_TOKEN_SECURITY)
export class DisciplinesController {
  constructor(private readonly listDisciplines: ListDisciplinesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List the global disciplines catalog' })
  @ApiOkResponse({ type: DisciplineModel, isArray: true })
  list(): Promise<DisciplineView[]> {
    return this.listDisciplines.execute();
  }
}
