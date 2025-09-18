import { Body, Controller, Get, Put, UploadedFile, UseInterceptors, UseGuards, HttpException, HttpStatus, UnsupportedMediaTypeException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from '@models/User.entity';
import * as uuid from 'uuid';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { EditProfileDto } from './dto/edit-profile.dto';
import { GetUser } from 'src/infrastructure/decorators/get-user.decorator';
const allowedFileExtensions = ['png', 'jpg', 'jpeg', 'gif'];

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtiene tu datos de usuario' })
  @Get('')
  getProfile(@GetUser() user: User) {
    return { ok: true, user };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: EditProfileDto })
  @ApiOperation({ summary: 'Edita tu datos de usuario (name, lastaName)' })
  @Put('')
  async editProfile(@GetUser() user: User, @Body() editProfileDto: EditProfileDto) {
    const userId = parseInt(`${user.id}`, 10);
    const usersaved = await this.userService.editProfile(userId, editProfileDto);

    return { ok: true, user: usersaved };
  }

  @UseGuards(JwtAuthGuard)
  @Put('avatar')
  @ApiOperation({ summary: 'Edita tu avatar de usuario' })
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

    const userId = parseInt(`${user.id}`, 10);
    const avatar = file.filename;
    const usersaved = await this.userService.changeAvatar(userId, avatar);

    return { ok: true, user: usersaved };
  }
}
