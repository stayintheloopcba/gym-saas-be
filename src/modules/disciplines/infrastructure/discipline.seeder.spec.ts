import { Repository } from 'typeorm';
import { Discipline } from '../domain/discipline.entity';
import { DisciplineSeeder } from './discipline.seeder';

describe('DisciplineSeeder', () => {
  const build = (existing: boolean) => {
    const repo = {
      findOne: jest.fn(({ where }) =>
        Promise.resolve(existing ? { id: `discipline-${where.code}`, code: where.code } : null),
      ),
      create: jest.fn((value) => ({ ...value })),
      save: jest.fn((value) => Promise.resolve({ id: `discipline-${value.code}`, ...value })),
    };
    return { seeder: new DisciplineSeeder(repo as unknown as Repository<Discipline>), repo };
  };

  it('seeds the fixed catalog when empty', async () => {
    const { seeder, repo } = build(false);

    await seeder.onApplicationBootstrap();

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ code: 'CROSSFIT', active: true }));
    expect(repo.save.mock.calls.length).toBeGreaterThan(1);
  });

  it('is idempotent when disciplines already exist', async () => {
    const { seeder, repo } = build(true);

    await seeder.onApplicationBootstrap();

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
