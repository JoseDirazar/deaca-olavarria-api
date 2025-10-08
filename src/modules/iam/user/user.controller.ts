import { Body, Controller, Get, Put, UploadedFile, UseInterceptors, UseGuards, UnsupportedMediaTypeException, Post, NotFoundException, Query, BadRequestException, Req } from '@nestjs/common';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';

import { User } from '@models/User.entity';
import * as uuid from 'uuid';
import { EditProfileDto } from './dto/edit-profile.dto';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesAllowed } from '../auth/decorators/roles.decorator';
import { Roles } from 'src/infrastructure/types/enums/Roles';
import { GetUsersPaginatedQueryParamsDto } from './dto/get-users-paginated-query-params.dto';
import { PaginatedResponse } from 'src/infrastructure/types/interfaces/pagination.interface';
import { ApiResponse } from 'src/infrastructure/types/interfaces/api-response.interface';
import { RolesGuard } from '../auth/guards/roles.guard';
export const allowedFileExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@GetUser("id") userId: string) {
    const userFound = await this.userService.findById(userId);
    if (!userFound) throw new NotFoundException('Usuario no encontrado');
    return { data: userFound };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Get('')
  async getUsers(@Query() params: GetUsersPaginatedQueryParamsDto): Promise<PaginatedResponse<User>> {
    const { users, count, page, limit } = await this.userService.getUsers(params)
    return {
      data: users,
      meta: {
        itemCount: count,
        itemsPerPage: limit,
        currentPage: page,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('')
  async editProfile(@GetUser() user: User, @Body() editProfileDto: EditProfileDto): Promise<ApiResponse<User>> {
    const usersaved = await this.userService.editProfile(user, editProfileDto);
    return { data: usersaved };
  }

  @Put('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter(req, file, callback) {
        if (
          !allowedFileExtensions.includes(
            file.originalname.split('.').pop() ?? '',
          )
        ) {
          return callback(new UnsupportedMediaTypeException(), false);
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: './upload/user/avatar/',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuid.v4();
          const extension = file.originalname.split('.').pop();
          const uniqueFilename = `${uniqueSuffix}.${extension}`;
          callback(null, uniqueFilename);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GetUser('id') userId: string,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!file) throw new BadRequestException('No se envio un archivo');

    const newAvatar = file.filename;
    const usersaved = await this.userService.changeAvatar(user, newAvatar);

    return { data: usersaved };
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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return await this.userService.findById(req.user.id);
  }
}
