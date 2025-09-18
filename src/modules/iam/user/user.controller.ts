import { Body, Controller, Get, Put, UploadedFile, UseInterceptors, UseGuards, HttpException, HttpStatus, UnsupportedMediaTypeException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';

import { User } from '@models/User.entity';
import * as uuid from 'uuid';
import { EditProfileDto } from './dto/edit-profile.dto';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
const allowedFileExtensions = ['png', 'jpg', 'jpeg', 'gif'];

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('')
  getProfile(@GetUser() user: User) {
    return { ok: true, user };
  }

  @UseGuards(JwtAuthGuard)
  @Put('')
  async editProfile(@GetUser() user: User, @Body() editProfileDto: EditProfileDto) {
    const usersaved = await this.userService.editProfile(user.id, editProfileDto);

    return { ok: true, user: usersaved };
  }

  @UseGuards(JwtAuthGuard)
  @Put('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter(req, file, callback) {
        if (!allowedFileExtensions.includes(file.originalname.split('.').pop() ?? '')) {
          return callback(new UnsupportedMediaTypeException(), false);
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: './uploads/avatar/',
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
    @GetUser() user: User,
  ) {
    if (!file) throw new HttpException('a file is required', HttpStatus.BAD_REQUEST);
    const avatar = file.filename;
    const usersaved = await this.userService.changeAvatar(user.id, avatar);

    return { ok: true, user: usersaved };
  }
}
