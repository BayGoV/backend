import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpService, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as jwkToPEM from 'jwk-to-pem';

const CLIENT_ID =
  '253851350328-d6ra0c1359j8ekov0asaqgfk97hbciom.apps.googleusercontent.com';
const GOOGLE_OID_DISCOVERY_URL =
  'https://accounts.google.com/.well-known/openid-configuration';

interface GoogleOidDiscovery {
  jwks_uri: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  jwks;

  constructor(private readonly httpService: HttpService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        // tslint:disable-next-line:no-console
        const secret = await this.verify(rawJwtToken).catch(console.error);
        done(null, secret);
      },
    });
    this.getKeys();
  }

  async validate(payload: any) {
    return true;
  }

  async getKeys() {
    const jwksResponse = await this.httpService
      .get<GoogleOidDiscovery>(GOOGLE_OID_DISCOVERY_URL)
      .toPromise();
    const keysResponse = await this.httpService
      .get(jwksResponse.data.jwks_uri)
      .toPromise();
    this.jwks = keysResponse.data;
  }

  async verify(rawJwtToken: string) {
    const ticket: any = await new OAuth2Client(CLIENT_ID).verifyIdToken({
      idToken: rawJwtToken,
      audience: CLIENT_ID,
    });
    return jwkToPEM(
      this.jwks.keys.find(key => key.kid === ticket.envelope.kid),
    );
  }
}
