import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from '@models/Session.entity';
import { User } from '@models/User.entity';
import { ConfigService } from '@nestjs/config';

export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly configService: ConfigService,
  ) { }

  async createSession(req: Request, user: User,): Promise<Session> {
    const jwtTokenRefreshExpiration: number = this.configService.get<number>('session.jwtTokenRefreshExpiration') ?? 604800; // 1 semana

    const expiredAt = new Date();
    expiredAt.setSeconds(expiredAt.getSeconds() + jwtTokenRefreshExpiration);
    const userAgent = req.headers['user-agent'];
    const session = new Session();
    session.user = user;
    session.ip = req.headers['x-forwarded-for'] || req["connection"].remoteAddress || '';
    session.browser = userAgent?.match(/(chrome|firefox|safari|edge|opera)/i) || '';
    session.operatingSystem = userAgent?.match(/(windows|mac os|linux|android|iOS)/i) || '';
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
