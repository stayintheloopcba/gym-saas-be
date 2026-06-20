import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleProfile } from '../application/google-auth.use-case';

/**
 * Estrategia de Google OAuth 2.0.
 *
 * Si `GOOGLE_CLIENT_ID/SECRET` no están configurados se usa un placeholder para
 * que la app igual arranque (Google es opcional en el MVP); el flujo fallará
 * recién al intentar usarlo, no al bootear.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'unconfigured',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'unconfigured',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3000/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google profile has no email'), undefined);
      return;
    }

    const googleProfile: GoogleProfile = {
      googleId: profile.id,
      email,
      name: profile.displayName || email,
    };
    done(null, googleProfile);
  }
}
