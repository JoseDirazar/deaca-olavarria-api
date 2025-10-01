import { Session } from '@models/Session.entity';
import { User } from '@models/User.entity';

export interface ValidatedSession {
  user: User;
  sessionId: string;
}

export interface GoogleUser {
  email: string;
}

export interface AccessRefreshTokenGenerated {
  accessToken: string;
  refreshToken: string;
  session: Session;
}
