import { Branch } from '../domain/branch.entity';

export interface BranchView {
  id: string;
  gymId: string;
  name: string;
  address: string | null;
  phone: string | null;
  openingHours: Record<string, unknown> | null;
  capacity: number | null;
  active: boolean;
  createdAt: Date;
}

export function toBranchView(branch: Branch): BranchView {
  return {
    id: branch.id,
    gymId: branch.gymId,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    openingHours: branch.openingHours,
    capacity: branch.capacity,
    active: branch.active,
    createdAt: branch.createdAt,
  };
}
