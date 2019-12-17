import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('api')
  authenticated(): string {
    return '"Success"';
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
