import { MembershipRole } from '../../../common/enums/membership-role.enum';
import { Organization } from '../domain/organization.entity';

/** Forma pública de una organización en las respuestas HTTP. */
export interface OrganizationView {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  trialEndsAt: Date | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
}

/** La misma vista anotada con el rol del usuario actual (listado "mis orgs"). */
export interface OrganizationWithRoleView extends OrganizationView {
  role: MembershipRole;
}

export function toOrganizationView(organization: Organization): OrganizationView {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    createdAt: organization.createdAt,
    trialEndsAt: organization.trialEndsAt ?? null,
    primaryColor: organization.primaryColor ?? null,
    secondaryColor: organization.secondaryColor ?? null,
    fontFamily: organization.fontFamily ?? null,
    logoUrl: organization.logoUrl ?? null,
    bannerUrl: organization.bannerUrl ?? null,
  };
}
