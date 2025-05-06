import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  addDays(date: Date, days: 30) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  validateAccessToken(token: string) {
    try {
      return this.jwt.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async validateRefreshToken(refreshPlain: string) {
    const hash = await bcrypt.hash(refreshPlain, 12);
    const token = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hash },
      include: { user: true },
    });

    if (!token || token.used || token.expires < new Date()) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    return token;
  }

  async rotateRefreshToken(oldRefresh: string) {
    const stored = await this.validateRefreshToken(oldRefresh);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { used: true },
    });

    if (!stored.user) {
      throw new UnauthorizedException('User not found for the refresh token');
    }
    return this.issueTokens(stored.userId, stored.user.email, stored.user.role);
  }

  async revokeRefresh(refreshPlain: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: await bcrypt.hash(refreshPlain, 12), used: false },
      data: { used: true },
    });
  }

  private async issueTokens(userId: string, email: string, role: Role) {
    const accessToken = this.jwt.sign(
      { sub: userId, email, role },
      { expiresIn: '15m' },
    );

    const refreshPlain = randomUUID();
    const hash = await bcrypt.hash(refreshPlain, 12);
    const expires = this.addDays(new Date(), 30);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hash, expires },
    });

    return { accessToken, refreshPlain };
  }

  async registerEmail(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: hash,
        provider: 'EMAIL',
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async loginEmail(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);

    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async loginWithGoogle(idToken: string) {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

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

    const refreshPlain = crypto.randomUUID();
    const hash = await bcrypt.hash(refreshPlain, 10);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); //30 days

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hash, expires },
    });

    return { accessToken, refreshPlain, user };
  }
}
