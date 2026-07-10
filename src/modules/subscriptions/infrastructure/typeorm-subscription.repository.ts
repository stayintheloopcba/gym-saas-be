import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../domain/subscription.entity';
import { SubscriptionListFilters, SubscriptionRepository } from '../domain/subscription.repository';

@Injectable()
export class TypeOrmSubscriptionRepository implements SubscriptionRepository {
  constructor(@InjectRepository(Subscription) private readonly repo: Repository<Subscription>) {}

  findById(gymId: string, id: string): Promise<Subscription | null> {
    return this.repo.findOne({ where: { id, gymId } });
  }

  list(gymId: string, filters: SubscriptionListFilters): Promise<Subscription[]> {
    return this.repo.find({
      where: {
        gymId,
        ...(filters.memberId ? { memberId: filters.memberId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      order: { startDate: 'DESC' },
    });
  }

  save(subscription: Subscription): Promise<Subscription> {
    return this.repo.save(subscription);
  }
}
