import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from '@models/Session.entity';
import { User } from '@models/User.entity';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly configService: ConfigService,
  ) { }

  async createSession(req: Request, user: User): Promise<Session> {
    const jwtTokenRefreshExpiration: number =
      this.configService.get<number>('session.jwtTokenRefreshExpiration') ?? 604800;

    const expiredAt = new Date();
    expiredAt.setSeconds(expiredAt.getSeconds() + jwtTokenRefreshExpiration);

    const userAgent = req.headers['user-agent'] || '';

    const session = new Session();
    session.user = user;

    // Obtener IP correctamente
    session.ip = (
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      req.ip ||
      ''
    ).toString().split(',')[0].trim();

    // Extraer browser
    session.browser = userAgent.match(/(chrome|firefox|safari|edge|opera|brave)/i)?.[0] || 'Unknown';

    // Extraer OS (corregido iOS)
    session.operatingSystem = userAgent.match(/(windows|mac os x|linux|android|iphone|ipad)/i)?.[0] || 'Unknown';

    session.expiredAt = expiredAt;

    return this.sessionRepository.save(session);
  }

  async removeSession(sessionId: string): Promise<void> {
    const session = await this.findOne(sessionId);
    if (!session) return;
    await this.sessionRepository.remove(session);
  }

  async findOne(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
  }

  async updateHashedRefreshToken(sessionId: string, hashedRefreshToken: string): Promise<void> {
    const session = await this.findOne(sessionId);
    if (!session) return;
    session.refreshToken = hashedRefreshToken;
    await this.sessionRepository.save(session);
  }
}
