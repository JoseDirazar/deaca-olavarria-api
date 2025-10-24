import {
  Body,
  Controller,
  Get,
  Put,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Post,
  NotFoundException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';

import { AccountStatus, User } from '@models/User.entity';
import { EditProfileDto } from './dto/edit-profile.dto';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesAllowed } from '../auth/dto/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { GetUsersPaginatedQueryParamsDto } from './dto/get-users-paginated-query-params.dto';
import { PaginatedResponse } from 'src/infrastructure/types/interfaces/pagination.interface';
import { ApiResponse } from 'src/infrastructure/types/interfaces/api-response.interface';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UploadInterceptor } from 'src/infrastructure/interceptors/upload.interceptor';
import { USER_AVATAR_PATH } from 'src/infrastructure/utils/upload-paths';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@GetUser('id') userId: string) {
    const userFound = await this.userService.findById(userId);
    if (!userFound) throw new NotFoundException('Usuario no encontrado');
    return { data: userFound };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Get('')
  async getUsers(
    @Query() params: GetUsersPaginatedQueryParamsDto,
  ): Promise<PaginatedResponse<User>> {
    const { users, count, page, limit } = await this.userService.getUsers(params);
    return {
      data: users,
      meta: {
        itemCount: count,
        itemsPerPage: limit,
        currentPage: page,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('')
  async editProfile(
    @GetUser('id') userId: string,
    @Body() editProfileDto: EditProfileDto,
  ): Promise<ApiResponse<User>> {
    const userFound = await this.userService.findById(userId);
    if (!userFound) throw new NotFoundException('Usuario no encontrado');
    const usersaved = await this.userService.editProfile(userFound, editProfileDto);
    return { data: usersaved };
  }

  @Put('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UploadInterceptor(USER_AVATAR_PATH, ['jpg', 'png', 'gif', 'jpeg']))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GetUser('id') userId: string,
  ): Promise<ApiResponse<User>> {
    if (!file) throw new BadRequestException('No se envió un archivo');

    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const updatedUser = await this.userService.changeAvatar(user, USER_AVATAR_PATH + file.filename);

    return { data: updatedUser };
  }

  @Post('approve-establishment-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async approveEstablishmentOwner(@Body('userId') userId: string): Promise<ApiResponse<User>> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const userSaved = await this.userService.approveEstablishmentOwner(user);
    return { data: userSaved };
  }

  @Put('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async changeUserAccountStatus(@Body('email') email: string, @Body('status') status: AccountStatus): Promise<ApiResponse<User>> {
    const user = await this.userService.userExistByEmail(email);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.userService.changeUserAccountStatus(user, status);
    return { message: `Usuario ${user.email}: ${status}` };
  }

  @Put('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesAllowed(Roles.ADMIN)
  async promoteUserToAdmin(@Body('email') email: string): Promise<ApiResponse<void>> {
    const user = await this.userService.userExistByEmail(email);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.userService.promoteUserToAdmin(user);
    return { message: `Usuario ${user.email} es ahora administrador` };
  }
}
