import { DataSource } from 'typeorm';
import { Member } from '../../members/domain/member.entity';
import { MemberStatus } from '../../members/domain/member-status.enum';
import { Role } from '../../permissions/domain/role.entity';
import { User } from '../../users/domain/user.entity';
import { Gym } from '../domain/gym.entity';
import { TypeOrmGymUnitOfWork } from './typeorm-gym-unit-of-work';

describe('TypeOrmGymUnitOfWork', () => {
  const buildManager = (overrides: { role?: Role | null; owner?: User | null } = {}) => {
    const gymRepo = { save: jest.fn((gym: Gym) => Promise.resolve({ ...gym, id: 'gym-1' })) };
    const memberRepo = { save: jest.fn((member: Member) => Promise.resolve(member)) };
    const roleRepo = {
      findOne: jest
        .fn()
        .mockResolvedValue(overrides.role === undefined ? { id: 'role-owner', key: 'owner' } : overrides.role),
    };
    const userRepo = {
      findOne: jest
        .fn()
        .mockResolvedValue(
          overrides.owner === undefined
            ? Object.assign(new User(), { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' })
            : overrides.owner,
        ),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Gym) return gymRepo;
        if (entity === Member) return memberRepo;
        if (entity === Role) return roleRepo;
        if (entity === User) return userRepo;
        throw new Error('Unexpected entity');
      }),
    };
    return { manager, gymRepo, memberRepo, roleRepo, userRepo };
  };

  const buildUnitOfWork = (manager: unknown) => {
    const dataSource = { transaction: jest.fn((callback) => callback(manager)) };
    return new TypeOrmGymUnitOfWork(dataSource as unknown as DataSource);
  };

  it('creates the gym and its owner Member atomically, splitting the name', async () => {
    const { manager, memberRepo } = buildManager();
    const unitOfWork = buildUnitOfWork(manager);

    const gym = new Gym();
    gym.name = 'Acme';
    gym.slug = 'acme';
    const saved = await unitOfWork.createGymWithOwner(gym, 'user-1');

    expect(saved.id).toBe('gym-1');
    expect(memberRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        gymId: 'gym-1',
        userId: 'user-1',
        roleId: 'role-owner',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        status: MemberStatus.ACTIVE,
      }),
    );
  });

  it('falls back to repeating the name when the owner has a single-word name', async () => {
    const { manager, memberRepo } = buildManager({
      owner: Object.assign(new User(), { id: 'user-1', name: 'Cher', email: 'cher@example.com' }),
    });
    const unitOfWork = buildUnitOfWork(manager);

    await unitOfWork.createGymWithOwner(Object.assign(new Gym(), { name: 'Acme', slug: 'acme' }), 'user-1');

    expect(memberRepo.save).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Cher', lastName: 'Cher' }));
  });

  it('throws when the owner role is not seeded', async () => {
    const { manager } = buildManager({ role: null });
    const unitOfWork = buildUnitOfWork(manager);

    await expect(
      unitOfWork.createGymWithOwner(Object.assign(new Gym(), { name: 'Acme', slug: 'acme' }), 'user-1'),
    ).rejects.toThrow('owner');
  });

  it('throws when the owner user does not exist', async () => {
    const { manager } = buildManager({ owner: null });
    const unitOfWork = buildUnitOfWork(manager);

    await expect(
      unitOfWork.createGymWithOwner(Object.assign(new Gym(), { name: 'Acme', slug: 'acme' }), 'missing-user'),
    ).rejects.toThrow('Owner user not found');
  });
});
