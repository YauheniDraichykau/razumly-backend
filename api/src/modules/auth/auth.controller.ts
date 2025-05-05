import { Body, Controller, Post, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('google')
  async google(
    @Body('idToken') idToken: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { accessToken, refreshPlain, user } = await this.auth.loginWithGoogle(
      idToken,
      req.ip,
    );

    res.cookie('refresh', refreshPlain, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return { accessToken, user };
  }
}
