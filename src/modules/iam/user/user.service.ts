import { User } from '@models/User.entity';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { EditProfileDto } from './dto/edit-profile.dto';
import { EmailService } from '@modules/email/email.service';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { join } from 'path';
import * as fs from 'fs/promises';
import { GetUsersPaginatedQueryParamsDto } from './dto/get-users-paginated-query-params.dto';
import { PaginatedResponse } from 'src/infrastructure/types/interfaces/pagination.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) { }

  async getUsers(params: GetUsersPaginatedQueryParamsDto): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10, role, email, search, sortBy, sortOrder } = params;
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) queryBuilder.andWhere('user.role = :role', { role });
    if (email) queryBuilder.andWhere('user.email = :email', { email });

    if (search) {
      // Search by full name or email using CONCAT function
      queryBuilder.andWhere(
        '(CONCAT(user.firstName, \' \', user.lastName) ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Whitelisted sorts to prevent SQL injection
    const allowedSorts: Record<string, string> = {
      firstName: 'user.firstName',
      lastName: 'user.lastName',
      email: 'user.email',
      createdAt: 'user.createdAt',
      role: 'user.role',
      lastLogin: 'user.lastLogin',
    };

    const orderColumn = sortBy && allowedSorts[sortBy] ? allowedSorts[sortBy] : 'user.lastLogin';
    const orderDirection: 'ASC' | 'DESC' = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(orderColumn, orderDirection);

    const [users, count] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      meta: {
        itemCount: count,
        itemsPerPage: limit,
        currentPage: page,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async createUser(dto: SignUpDto): Promise<User> {

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const randomNumber = Math.floor(Math.random() * 100000);
    const emailVerificationCode = randomNumber.toString().padStart(5, '0');

    const response = await this.emailService.sendEmail(dto.email, 'Verificación de correo', `<p>Tu código de verificación es: ${emailVerificationCode}<p>`);
    const user = new User();
    console.log('SEND EMAIL LOG: ', response);
    user.email = dto.email;
    user.password = hashedPassword;
    user.role = Roles.USER;
    user.emailCode = emailVerificationCode;
    user.emailCodeCreatedAt = new Date();
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  // Used in loadDataByDefault ONLY
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

  async findByEmailWithPassword(email: string): Promise<string | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (user) return (user as User).password as any;

    return null;
  }

  async updateLastLogin(user: User): Promise<User> {
    user.lastLogin = new Date();
    return this.userRepository.save(user);
  }

  // Map only provided fields from EditProfileDto to the user entity
  private applyEditProfile(user: User, dto: EditProfileDto): void {
    const allowedKeys: (keyof EditProfileDto & keyof User)[] = [
      'firstName',
      'lastName',
      'avatar',
      'emailVerified',
      'emailCode',
      'emailCodeCreatedAt',
      'password',
      'role',
      'lastLogin',
    ];

    for (const key of allowedKeys) {
      const value = dto[key as keyof EditProfileDto];
      if (value !== undefined) {
        (user as any)[key] = value as any;
      }
    }
  }

  async editProfile(user: User, editProfileDto: EditProfileDto): Promise<User> {
    this.applyEditProfile(user, editProfileDto);
    return this.userRepository.save(user);
  }

  async changeAvatar(userId: string, newAvatarFilePath: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si existe un avatar previo, eliminarlo
    if (user.avatar) {
      try {
        const oldAvatarPath = join(
          process.cwd(),
          'uploads',
          'user',
          'avatar',
          user.avatar,
        );
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        // Log error pero continuar con la actualización
        console.error('Error eliminando avatar anterior:', error);
      }
    }

    user.avatar = newAvatarFilePath;
    return this.userRepository.save(user);
  }

  async createWithGoogle(email: string): Promise<User> {
    const password = this.generateRandomPassword();
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User();
    user.email = email;
    user.password = hashedPassword;
    user.emailVerified = true;

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

  async approveEstablishmentOwner(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.role = Roles.BUSINESS_OWNER;
    return this.userRepository.save(user);
  }

  async requestPasswordResetCode(email: string): Promise<User> {
    const user = await this.userRepository.createQueryBuilder('user').where('user.email = :email', { email })
      .addSelect('user.password')
      .addSelect('user.emailCode')
      .addSelect('user.emailCodeCreatedAt')
      .getOne();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetCode = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    user.emailCode = resetCode;
    user.emailCodeCreatedAt = new Date();
    await this.userRepository.save(user);

    await this.emailService.sendEmail(
      email,
      'Codigo para restablecer contraseña',
      `<p>Tu codigo para restablecer contraseña es: ${resetCode}</p><p>Este codigo expira en 24 horas.</p>`,
    );

    return user;
  }

  async getVerificationCode(email: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.emailCode') // 👈 con esto incluís el campo
      .where('user.email = :email', { email })
      .getOne();
    return user;
  }

  async getResssetCodeAndPassword(email: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.emailCode')
      .addSelect('user.password')
      .addSelect('user.emailCodeCreatedAt')
      .addSelect('user.id')
      .where('user.email = :email', { email })
      .getOne();
    return user;
  }
}
