import { User } from "@models/User.entity";
import { Session } from "inspector";

export class ValidatedSession {
  user: User;
  sessionId: string;
}

export interface IGoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export class GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export class AccessRefreshTokenGenerated {
  session: Session;
  refreshToken: string;
}