import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async loginWithGoogle(idToken: string, ip?: string) {
    console.log('ip', ip);
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email)
      throw new UnauthorizedException('Invalid Google token');

    const user = await this.prisma.user.upsert({
      where: { email: payload.email },
      update: {
        googleId: payload.sub,
        name: payload.name,
        avatar: payload.picture,
      },
      create: {
        email: payload.email,
        googleId: payload.sub,
        name: payload.name,
        avatar: payload.picture,
      },
    });

    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // refresh
    const refreshPlain = crypto.randomUUID();
    const hash = await bcrypt.hash(refreshPlain, 10);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); //30 days
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hash, expires },
    });

    return { accessToken, refreshPlain, user };
  }
}
