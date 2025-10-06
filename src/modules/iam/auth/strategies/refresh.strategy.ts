import { ConfigType } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { AuthJwtPayload } from "../types/auth-jwtPayload";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import refreshJwtConfig from "src/config/refresh-jwt.config";
import { Request } from "express";
import { AuthService } from "../auth.service";

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, "refresh-jwt") {
    constructor(@Inject(refreshJwtConfig.KEY) private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>, private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: refreshJwtConfiguration.secret!,
            ignoreExpiration: false,
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: AuthJwtPayload) {
        const refreshToken = req.get("authorization")?.replace("Bearer ", "").trim();
        if (!refreshToken) throw new UnauthorizedException("Refresh token not found");
        const sessionId = payload.sessionId;
        return this.authService.validateRefreshTokenV2(sessionId, refreshToken);
    }
}