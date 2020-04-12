import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  HttpException,
  HttpService,
  HttpStatus,
  Injectable, Logger,
} from '@nestjs/common';
import * as jwkToPEM from 'jwk-to-pem';
import { decode } from 'jsonwebtoken';

const BGOV_OID_DISCOVERY_URL =
  'https://securetoken.google.com/bgov-web/.well-known/openid-configuration';

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
        const secret = await this.verify(rawJwtToken).catch(e => {
          this.getKeys();
          Logger.error('JWT verify error', e);
        });
        done(null, secret);
      },
    });
    this.getKeys();
  }

  async validate(payload: any) {
    if (payload.iss !== 'https://securetoken.google.com/bgov-web') {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    return payload;
  }

  async getKeys() {
    const jwksResponse = await this.httpService
      .get<GoogleOidDiscovery>(BGOV_OID_DISCOVERY_URL)
      .toPromise();
    const keysResponse = await this.httpService
      .get(jwksResponse.data.jwks_uri)
      .toPromise();
    this.jwks = keysResponse.data;
  }

  async verify(rawJwtToken: string) {
    const ticket: any = decode(rawJwtToken, { complete: true });
    try {
      return jwkToPEM(
        this.jwks.keys.find(key => key.kid === ticket.header.kid),
      );
    } catch (e) {
      return '';
    }
  }
}
