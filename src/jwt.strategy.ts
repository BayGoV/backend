import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpService, Injectable } from '@nestjs/common';
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
        // tslint:disable-next-line:no-console
        const secret = await this.verify(rawJwtToken).catch(e => {
          this.getKeys();
          // tslint:disable-next-line:no-console
          console.error(e);
        });
        done(null, secret);
      },
    });
    this.getKeys();
  }

  async validate(payload: any) {
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
    return jwkToPEM(this.jwks.keys.find(key => key.kid === ticket.header.kid));
  }
}
