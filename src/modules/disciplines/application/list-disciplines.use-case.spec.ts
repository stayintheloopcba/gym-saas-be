import { Discipline } from '../domain/discipline.entity';
import { DisciplineRepository } from '../domain/discipline.repository';
import { ListDisciplinesUseCase } from './list-disciplines.use-case';

describe('ListDisciplinesUseCase', () => {
  it('returns the active disciplines as views', async () => {
    const disciplines: jest.Mocked<Pick<DisciplineRepository, 'listActive'>> = {
      listActive: jest
        .fn()
        .mockResolvedValue([
          Object.assign(new Discipline(), { id: 'd1', code: 'CROSSFIT', name: 'Crossfit', active: true }),
        ]),
    };
    const useCase = new ListDisciplinesUseCase(disciplines as unknown as DisciplineRepository);

    const views = await useCase.execute();

    expect(views).toEqual([{ id: 'd1', code: 'CROSSFIT', name: 'Crossfit', active: true }]);
  });
});
