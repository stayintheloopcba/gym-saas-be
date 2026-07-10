import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RoutineAssignment } from '../domain/routine-assignment.entity';
import { RoutineAssignmentRepository } from '../domain/routine-assignment.repository';

@Injectable()
export class TypeOrmRoutineAssignmentRepository implements RoutineAssignmentRepository {
  constructor(@InjectRepository(RoutineAssignment) private readonly repo: Repository<RoutineAssignment>) {}

  findById(gymId: string, id: string): Promise<RoutineAssignment | null> {
    return this.repo.findOne({ where: { id, gymId } });
  }

  findActive(gymId: string, memberId: string, routineId: string): Promise<RoutineAssignment | null> {
    return this.repo.findOne({ where: { gymId, memberId, routineId, unassignedAt: IsNull() } });
  }

  listActiveByMember(gymId: string, memberId: string): Promise<RoutineAssignment[]> {
    return this.repo.find({ where: { gymId, memberId, unassignedAt: IsNull() }, order: { assignedAt: 'DESC' } });
  }

  save(assignment: RoutineAssignment): Promise<RoutineAssignment> {
    return this.repo.save(assignment);
  }
}
