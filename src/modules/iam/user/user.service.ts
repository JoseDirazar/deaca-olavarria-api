import { AccountStatus, User } from '@models/User.entity';
import { MoreThan, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EditProfileDto } from './dto/edit-profile.dto';
import { EmailService } from '@modules/email/email.service';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import path from 'path';
import * as fs from 'fs/promises';
import { GetUsersPaginatedQueryParamsDto } from './dto/get-users-paginated-query-params.dto';
import { TokenPayload } from 'google-auth-library';
import { UserMapper } from './mapper/user-mapper';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { UploadService } from '@modules/upload/upload.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly uploadService: UploadService,
  ) {}

  async getUsers(params: GetUsersPaginatedQueryParamsDto) {
    const { page = 1, limit = 10, role, email, search, sortBy, sortOrder } = params;
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) queryBuilder.andWhere('user.role = :role', { role });
    if (email) queryBuilder.andWhere('user.email = :email', { email });

    if (search) {
      // Search by full name or email using CONCAT function
      queryBuilder.andWhere(
        "(CONCAT(user.firstName, ' ', user.lastName) ILIKE :search OR user.email ILIKE :search)",
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
      users,
      count,
      page,
      limit,
    };
  }

  async getAdminUsersChart() {
    const totalUsers = await this.userRepository
      .createQueryBuilder('user')
      .select('user.createdAt', 'createdAt')
      .getRawMany();
    return totalUsers;
  }

  async createUser(dto: SignUpDto): Promise<User> {
    const randomNumber = Math.floor(Math.random() * 100000);
    const emailVerificationCode = randomNumber.toString().padStart(5, '0');

    await this.emailService.sendEmail(
      dto.email,
      'Verificación de correo',
      `<p>Tu código de verificación es: ${emailVerificationCode}<p>`,
    );
    const user = new User();
    user.email = dto.email;
    user.password = dto.password;
    user.role = Roles.USER;
    user.emailCode = emailVerificationCode;
    user.emailCodeCreatedAt = new Date();
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  // Used in loadDataByDefault ONLY
  async createUserAdmin(email: string, password: string): Promise<User> {
    const user = new User();
    user.email = email;
    user.password = password;
    user.role = Roles.ADMIN;
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }

  async userExistByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
    return user;
  }

  async updateLastLogin(user: User): Promise<User> {
    user.lastLogin = new Date();
    return this.userRepository.save(user);
  }

  editProfile(user: User, editProfileDto: EditProfileDto): Promise<User> {
    return this.userRepository.save({ ...user, ...editProfileDto });
  }

  async changeAvatar(user: User, newAvatarFilePath: string): Promise<User> {
    if (user.avatar) {
      const oldAvatarPath = this.uploadService.resolveUploadPath('user', user.avatar);
      await this.uploadService.deleteFileIfExists(oldAvatarPath);
    }
    const normalizedPath = await this.uploadService.normalizeImage(newAvatarFilePath);
    user.avatar = normalizedPath;
    return this.userRepository.save(user);
  }

  async createWithGoogle(googleUser: TokenPayload): Promise<User> {
    const user = await UserMapper.createUserWithGooglePayload(googleUser);
    console.log('google user', user);
    if (googleUser.picture) {
      console.log('google user picture', googleUser.picture);
      const avatarFilePath = await this.downloadAndSaveGoogleAvatar(googleUser.picture);
      console.log('avatar file path', avatarFilePath);
      user.avatar = avatarFilePath!;
    }
    console.log('user to save', user);
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  async approveEstablishmentOwner(user: User): Promise<User> {
    user.role = Roles.BUSINESS_OWNER;
    return this.userRepository.save(user);
  }

  async getUserWithUnselectableFields(email: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .addSelect('user.emailCode')
      .addSelect('user.emailCodeCreatedAt')
      .getOne();
    return user;
  }

  async getVerificationCode(email: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.emailCode')
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

  async sendEmailVerificationCode(user: User) {
    await this.emailService.sendEmail(
      user.email,
      'Verificación de correo',
      `<p>Tu código de verificación es: ${user.emailCode}<p>`,
    );
  }

  async generateResetCodeAndUpdateUser(user: User) {
    const resetCode = UserMapper.generateResetCode();
    user.emailCode = resetCode;
    user.emailCodeCreatedAt = new Date();
    return await this.userRepository.save(user);
  }

  async verifyEmailAndResetEmailCode(user: User) {
    return UserMapper.verifyEmailAndResetEmailCode(user);
  }

  async changePassword(user: User, newPassword: string): Promise<User> {
    const mapperUser = await UserMapper.resetPassword(user, newPassword);
    return this.editProfile(user, mapperUser);
  }

  private async downloadAndSaveGoogleAvatar(imageUrl: string) {
    try {
      const uploadDir = path.join(process.cwd(), 'upload', 'user');
      await fs.mkdir(uploadDir, { recursive: true });

      const fileExtension = '.jpg';
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'arraybuffer',
      });

      await fs.writeFile(filePath, response.data);

      return fileName;
    } catch (error) {
      console.error('Error saving Google avatar:', error);
      return null;
    }
  }

  async changeUserAccountStatus(user: User, status: AccountStatus): Promise<User> {
    user.status = status;
    return this.userRepository.save(user);
  }

  async promoteUserToAdmin(user: User): Promise<User> {
    user.role = Roles.ADMIN;
    return this.userRepository.save(user);
  }

  async becomeBusinessOwner(user: User): Promise<User> {
    user.role = Roles.BUSINESS_OWNER;
    return this.userRepository.save(user);
  }
}
