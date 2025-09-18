import { User } from '@models/User.entity';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { EditProfileDto } from './dto/edit-profile.dto';
import { Roles } from 'src/infrastructure/types/enums/roles';
import { EmailService } from '@modules/email/email.service';
import { SignUpDto } from '../auth/dto/sign-up.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async createUser(dto: SignUpDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const randomNumber = Math.floor(Math.random() * 100000);
    const emailVerificationCode = randomNumber.toString().padStart(5, '0');

    const response = await this.emailService.sendEmail(dto.email, 'Verificación de correo', `<p>Tu código de verificación es: ${emailVerificationCode}<p>`);
    const user = new User();
    user.email = dto.email;
    user.password = hashedPassword;
    user.role = Roles.USER;
    user.emailCode = emailVerificationCode;
    //user.email_code_create_at = Date.now()
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  // Used in loadDataByDefault
  async createUserAdmin(email: string, password: string): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User();
    user.email = email;
    user.password = hashedPassword;
    user.role = Roles.ADMIN;
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  async findById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async userExistByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const user = await this.userRepository.createQueryBuilder('user').select('user.password').where('user.email = :email', { email }).getRawOne();

    if (user) return user.user_password;

    return null;
  }

  async updateLastLogin(user: User): Promise<User> {
    user.lastLogin = new Date();
    return this.userRepository.save(user);
  }

  async editProfile(userId: string, editProfileDto: EditProfileDto): Promise<User> {
    const user = await this.findById(userId);
    user.firstName = editProfileDto.firstName;
    user.lastName = editProfileDto.lastName;
    return this.userRepository.save(user);
  }

  async changeAvatar(userId: string, avatar: string): Promise<User> {
    const user = await this.findById(userId);
    user.avatar = avatar;
    return this.userRepository.save(user);
  }

  async createWithGoogle(email: string): Promise<User> {
    const password = this.generateRandomPassword();
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User();
    user.email = email;
    user.password = hashedPassword;
    user.email_verified = true;

    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }

  generateRandomPassword(): string {
    const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@.';
    let password = '';

    for (let i = 0; i < 14; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      password += caracteres.charAt(indice);
    }

    password += '@.';

    password = password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    return password;
  }
}
