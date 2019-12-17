import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [HttpModule, PassportModule, JwtModule.register({})],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {
}
