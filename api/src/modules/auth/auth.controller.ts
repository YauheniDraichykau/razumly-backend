import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { LoginDto, RegisterDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setRefreshCookie(res: Response, refreshPlain: string) {
    res.cookie('refresh', refreshPlain, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshPlain } = await this.auth.registerEmail(dto);
    this.setRefreshCookie(res, refreshPlain);
    return { accessToken };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshPlain } = await this.auth.loginEmail(dto);
    this.setRefreshCookie(res, refreshPlain);
    return { accessToken };
  }

  @Post('google')
  async google(
    @Body('idToken') idToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshPlain, user } =
      await this.auth.loginWithGoogle(idToken);

    this.setRefreshCookie(res, refreshPlain);

    return { accessToken, user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefresh = req.cookies['refresh'];
    const { accessToken, refreshPlain } =
      await this.auth.rotateRefreshToken(oldRefresh);

    res.cookie('refresh', refreshPlain, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    return { accessToken };
  }
}
