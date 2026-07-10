import { RoleSummary } from '../../permissions/domain/role-summary';
import { Member } from '../domain/member.entity';
import { MemberStatus } from '../domain/member-status.enum';

/**
 * Forma pública de un `Member` en las respuestas HTTP. `status` es el que
 * devuelve `ResolveMemberStatus`: puede reflejar `OVERDUE` derivado en
 * lectura (Technical Decision #6) aunque el valor persistido siga `ACTIVE`.
 */
export interface MemberView {
  id: string;
  gymId: string;
  userId: string | null;
  role: RoleSummary;
  branchId: string | null;
  firstName: string;
  lastName: string;
  documentId: string | null;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  status: MemberStatus;
  consents: Record<string, unknown> | null;
  createdAt: Date;
}

export function toMemberView(member: Member, role: RoleSummary, status: MemberStatus = member.status): MemberView {
  return {
    id: member.id,
    gymId: member.gymId,
    userId: member.userId,
    role,
    branchId: member.branchId,
    firstName: member.firstName,
    lastName: member.lastName,
    documentId: member.documentId,
    email: member.email,
    phone: member.phone,
    birthDate: member.birthDate,
    photoUrl: member.photoUrl,
    emergencyContactName: member.emergencyContactName,
    emergencyContactPhone: member.emergencyContactPhone,
    status,
    consents: member.consents,
    createdAt: member.createdAt,
  };
}
