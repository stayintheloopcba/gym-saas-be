import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import {
  DEFAULT_CURRENCY,
  DEFAULT_ENABLED_PAYMENT_METHODS,
  DEFAULT_MORA_GRACE_DAYS,
  DEFAULT_TIMEZONE,
  GymSettings,
} from '../domain/gym-settings.entity';

export interface GymSettingsView {
  gymId: string;
  displayName: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
  theme: string | null;
  timezone: string;
  currency: string;
  openingHours: Record<string, unknown> | null;
  contactEmail: string | null;
  contactPhone: string | null;
  moraGraceDays: number;
  moraSurchargePct: number;
  renewalPolicy: Record<string, unknown> | null;
  enabledPaymentMethods: PaymentMethod[];
}

export function toGymSettingsView(settings: GymSettings): GymSettingsView {
  return {
    gymId: settings.gymId,
    displayName: settings.displayName,
    logoUrl: settings.logoUrl,
    bannerUrl: settings.bannerUrl,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    fontFamily: settings.fontFamily,
    theme: settings.theme,
    timezone: settings.timezone,
    currency: settings.currency,
    openingHours: settings.openingHours,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    moraGraceDays: settings.moraGraceDays,
    moraSurchargePct: Number(settings.moraSurchargePct),
    renewalPolicy: settings.renewalPolicy,
    enabledPaymentMethods: settings.enabledPaymentMethods,
  };
}

/** Vista con los defaults de fábrica, para un gym que aún no configuró nada. */
export function defaultGymSettingsView(gymId: string): GymSettingsView {
  return {
    gymId,
    displayName: null,
    logoUrl: null,
    bannerUrl: null,
    primaryColor: null,
    secondaryColor: null,
    fontFamily: null,
    theme: null,
    timezone: DEFAULT_TIMEZONE,
    currency: DEFAULT_CURRENCY,
    openingHours: null,
    contactEmail: null,
    contactPhone: null,
    moraGraceDays: DEFAULT_MORA_GRACE_DAYS,
    moraSurchargePct: 0,
    renewalPolicy: null,
    enabledPaymentMethods: DEFAULT_ENABLED_PAYMENT_METHODS,
  };
}
