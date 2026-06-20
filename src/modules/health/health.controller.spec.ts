import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let query: jest.Mock;

  beforeEach(async () => {
    query = jest.fn();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: getDataSourceToken(), useValue: { query } }],
    }).compile();

    controller = moduleRef.get<HealthController>(HealthController);
  });

  it('returns ok when the database responds', async () => {
    query.mockResolvedValue([{ result: 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(typeof result.uptime).toBe('number');
    expect(typeof result.timestamp).toBe('string');
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns error when the database is unreachable', async () => {
    query.mockRejectedValue(new Error('connection refused'));

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect(result.database).toBe('down');
  });
});
