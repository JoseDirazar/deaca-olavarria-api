import { Body, Controller, Get, Put, UploadedFile, UseInterceptors, UseGuards, HttpException, HttpStatus, UnsupportedMediaTypeException, Post, NotFoundException, Query } from '@nestjs/common';
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
export const allowedFileExtensions = ['png', 'jpg', 'jpeg', 'gif'];

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@GetUser() user: User) {
    return { ok: true, user };
  }

  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  @Get('')
  getUsers(@Query() params: GetUsersPaginatedQueryParamsDto) {
    return this.userService.getUsers(params).then((res) => ({ ok: true, ...res }));
  }

  @UseGuards(JwtAuthGuard)
  @Put('')
  async editProfile(@GetUser() user: User, @Body() editProfileDto: EditProfileDto) {
    const usersaved = await this.userService.editProfile(user, editProfileDto);

    return { ok: true, user: usersaved };
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
        destination: './uploads/user/avatars/',
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
    @UploadedFile()
    file: Express.Multer.File,
    @GetUser('id') userId: string,
  ) {
    if (!file)
      throw new HttpException('a file is required', HttpStatus.BAD_REQUEST);

    const newAvatar = file.filename;
    const usersaved = await this.userService.changeAvatar(userId, newAvatar);

    return { ok: true, user: usersaved };
  }

  @Post('approve-establishment-owner')
  @UseGuards(JwtAuthGuard)
  @RolesAllowed(Roles.ADMIN)
  async approveEstablishmentOwner(@Body('userId') userId: string) {
    const user = await this.userService.approveEstablishmentOwner(userId);
    if (!user) return new NotFoundException('No se encontro el usuario');

    return user;
  }
}
