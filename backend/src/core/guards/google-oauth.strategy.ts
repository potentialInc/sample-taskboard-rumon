import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth2 Strategy for Passport
 * PRD Requirement: 3.2.2 Authentication
 *
 * Handles Google OAuth authentication flow
 * Users can sign in using their Google accounts
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private configService: ConfigService) {
        super({
            clientID:
                configService.get<string>('GOOGLE_CLIENT_ID') ||
                'placeholder-client-id',
            clientSecret:
                configService.get<string>('GOOGLE_CLIENT_SECRET') ||
                'placeholder-client-secret',
            callbackURL:
                configService.get<string>('GOOGLE_CALLBACK_URL') ||
                'http://localhost:3000/api/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<any> {
        const { name, emails, photos } = profile;

        if (!emails || emails.length === 0) {
            return done(
                new Error('No email found in Google profile'),
                undefined,
            );
        }

        const user = {
            email: emails[0].value,
            name: name
                ? `${name.givenName || ''} ${name.familyName || ''}`.trim()
                : emails[0].value.split('@')[0],
            profilePhotoUrl: photos?.[0]?.value,
            googleId: profile.id,
            accessToken,
        };

        done(null, user);
    }
}
