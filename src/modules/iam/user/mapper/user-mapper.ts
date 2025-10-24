import { TokenPayload } from 'google-auth-library';
import { AccountStatus, User } from '@models/User.entity';
import * as argon2 from 'argon2';
import { EditProfileDto } from '@modules/iam/user/dto/edit-profile.dto';

export class UserMapper {
  static async generateRandomPassword(): Promise<string> {
    const caracteres = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    let password = '';

    for (let i = 0; i < 5; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      password += caracteres.charAt(indice);
    }

    password += '@';

    for (let i = 0; i < 4; i++) {
      const indice = Math.floor(Math.random() * numeros.length);
      password += numeros.charAt(indice);
    }

    return password;
  }

  static async hashPassword(password: string): Promise<string> {
    const hashedPassword = await argon2.hash(password);
    return hashedPassword;
  }

  static generateResetCode(): string {
    const resetCode = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return resetCode;
  }

  static updateUserWithGooglePayload(payload: TokenPayload, user: User): User {
    user.email = payload.email!;
    user.firstName = payload.given_name!;
    user.lastName = payload.family_name!;
    user.avatar = payload.picture!;
    user.status = AccountStatus.ACTIVE;
    return user;
  }

  static async createUserWithGooglePayload(payload: TokenPayload): Promise<Partial<User>> {
    const user = new User();
    user.email = payload.email!;
    user.firstName = payload.given_name!;
    user.lastName = payload.family_name!;
    user.status = AccountStatus.PENDING;
    user.password = await this.generateRandomPassword();
    return user;
  }

  static dtoToUser(user: User, dto: EditProfileDto): User {
    user.firstName = dto.firstName!;
    user.lastName = dto.lastName!;
    user.avatar = dto.avatar!;

    return user;
  }

  static verifyEmailAndResetEmailCode(user: User) {
    user.status = AccountStatus.ACTIVE;
    user.emailCode = '';
    return user;
  }

  static async resetPassword(user: User, newPassword: string): Promise<User> {
    const hashedPassword = await this.hashPassword(newPassword);
    user.password = hashedPassword;
    user.emailCode = '';
    return user;
  }
}
