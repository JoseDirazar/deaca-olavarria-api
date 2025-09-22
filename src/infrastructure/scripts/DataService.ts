import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '@modules/iam/user/user.service';
@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);
  constructor(private readonly userService: UserService) { }

  async loadDataByDefault(): Promise<void> {
    const defaultUsers = [
      {
        email: 'jfdirazar@gmail.com',
        password: 'Qwer@1234',
      },
    ];

    for (const user of defaultUsers) {
      this.logger.debug(`creating default user ${user.email} if it does not exist`);
      const userExists = await this.userService.userExistByEmail(user.email);

      if (!userExists) {
        await this.userService.createUserAdmin(user.email, user.password);
      }
    }
  }
}
