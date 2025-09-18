import { Session } from '@models/Session.entity';
import { User } from '@models/User.entity';

export interface validatedSession {
  user: User;
  sessionId: number;
}

export interface GoogleUser {
  email: string;
}

export interface AccessRefreshTokenGenerated {
  session: Session;
  refreshToken: string;
}
