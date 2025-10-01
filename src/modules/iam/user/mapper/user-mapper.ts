import { TokenPayload } from "google-auth-library";
import { User } from "@models/User.entity";
import * as bcrypt from 'bcrypt';
import { EditProfileDto } from "@modules/iam/user/dto/edit-profile.dto";

export class UserMapper {
    static async generateRandomPassword(): Promise<string> {
        const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@.';
        let password = '';

        for (let i = 0; i < 14; i++) {
            const indice = Math.floor(Math.random() * caracteres.length);
            password += caracteres.charAt(indice);
        }

        password += '@.';

        password = password.split('').sort(() => Math.random() - 0.5).join('');

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }

    static async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }

    static generateResetCode(): string {
        const resetCode = Math.floor(Math.random() * 100000)
            .toString()
            .padStart(5, '0');
        return resetCode;
    }

    static updateUserWithGooglePayload(payload: TokenPayload, user: User): User {
        return {
            ...user,
            email: payload.email!,
            firstName: payload.given_name!,
            lastName: payload.family_name!,
            avatar: payload.picture!,
            emailVerified: true,
        };


    }

    static async createUserWithGooglePayload(payload: TokenPayload): Promise<Partial<User>> {
        const user = new User();
        user.email = payload.email!;
        user.firstName = payload.given_name!;
        user.lastName = payload.family_name!;
        user.avatar = payload.picture!;
        user.emailVerified = true;
        user.password = await this.generateRandomPassword();
        return user;
    }

    static dtoToUser(user: User, dto: EditProfileDto): User {
        return {
            ...user,
            ...dto,
        };
    }

    static verifyEmailAndResetEmailCode(user: User) {
        user.emailVerified = true;
        user.emailCode = '';
        return user;
    }

    static async resetPassword(
        user: User,
        newPassword: string,
    ): Promise<User> {
        const hashedPassword = await this.hashPassword(newPassword);
        user.password = hashedPassword;
        user.emailCode = '';
        return user;
    }
}
