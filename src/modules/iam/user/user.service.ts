import { User } from '@models/User.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { EditProfileDto } from './dto/edit-profile.dto';
import { EmailService } from '@modules/email/email.service';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import path, { join } from 'path';
import * as fs from 'fs/promises';
import { GetUsersPaginatedQueryParamsDto } from './dto/get-users-paginated-query-params.dto';
import { TokenPayload } from 'google-auth-library';
import { UserMapper } from './mapper/user-mapper';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) { }

  async getUsers(params: GetUsersPaginatedQueryParamsDto) {
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
      users,
      count,
      page,
      limit,
    }
  }

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
    user.emailCodeCreatedAt = new Date();
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
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

  editProfile(user: User, editProfileDto: EditProfileDto | TokenPayload): Promise<User> {
    if (editProfileDto instanceof EditProfileDto) {
      const updatedUser = UserMapper.dtoToUser(user, editProfileDto);
      return this.userRepository.save(updatedUser);
    }
    const updatedUser = UserMapper.updateUserWithGooglePayload(editProfileDto, user);
    return this.userRepository.save(updatedUser);
  }

  async changeAvatar(user: User, newAvatarFilePath: string): Promise<User> {

    // Si existe un avatar previo, eliminarlo
    if (user.avatar) {
      try {
        const oldAvatarPath = join(
          process.cwd(),
          'upload',
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

  async createWithGoogle(googleUser: TokenPayload): Promise<User> {
    const user = await UserMapper.createUserWithGooglePayload(googleUser);
    const savedUser = await this.userRepository.save(user);
    return savedUser;
  }

  async approveEstablishmentOwner(user: User): Promise<User> {
    user.role = Roles.BUSINESS_OWNER;
    return this.userRepository.save(user);
  }

  async getUserWithUnselectableFields(email: string) {
    const user = await this.userRepository.createQueryBuilder('user').where('user.email = :email', { email })
      .addSelect('user.password')
      .addSelect('user.emailCode')
      .addSelect('user.emailCodeCreatedAt')
      .getOne();
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

  sendEmailVerificationCode(user: User) {
    this.emailService.sendEmail(
      user.email,
      'Verificación de correo',
      `<p>Tu código de verificación es: ${user.emailCode}<p>`,
    );
  }

  generateResetCodeAndUpdateUser(user: User) {
    const resetCode = UserMapper.generateResetCode();
    user.emailCode = resetCode;
    user.emailCodeCreatedAt = new Date();
    return this.userRepository.save(user);
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
      const uploadDir = path.join(process.cwd(), 'uploads', 'user', 'avatar');
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

}
