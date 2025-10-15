import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '@modules/iam/user/user.service';
import { CategoryService } from '@modules/category/category.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '@models/Image.entity';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);
  constructor(@InjectRepository(Image) private readonly imageRepository: Repository<Image>, private readonly userService: UserService, private readonly categoryService: CategoryService,) { }

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

    const defaultCategories = [
      {
        name: 'Alimentos y Bebidas',
        icon: 'alimentos-y-bebidas.svg',
      },
      {
        name: 'Arte',
        icon: 'arte-icon.svg',
      },
      {
        name: "Artesanias y diseños",
        icon: 'artesanias-y-diseños.svg',
      },
      {
        name: "Clases",
        icon: 'clases.svg',
      },
      {
        name: "Costuras y Tejidos",
        icon: 'costuras-y-tejidos.svg',
      },
      {
        name: "Cuidado Personal",
        icon: 'cuidado-personal.svg',
      },
      {
        name: "Cuidados a domicilio",
        icon: 'cuidados-a-domicilio.svg',
      },
      {
        name: "Fiestas y eventos",
        icon: 'fiestas-y-eventos.svg',
      },
      {
        name: "Hogar",
        icon: 'hogar.svg',
      },
      {
        name: "Jardin y Plantas",
        icon: 'jardin-y-plantas.svg',
      },
      {
        name: "Marketing e Informatica",
        icon: 'marketing-e-informatica.svg',
      },
      {
        name: "Mascotas",
        icon: 'mascotas.svg',
      },
      {
        name: "Mundo Infantil",
        icon: 'mundo-infantil.svg',
      },
      {
        name: 'Salud',
        icon: 'salud.svg',
      },
      {
        name: 'Terapias y Alternativas',
        icon: 'terapias-y-alternativas.svg',
      },
      {
        name: 'Vida Activa',
        icon: 'vida-activa.svg',

      },
    ];

    for (const category of defaultCategories) {
      this.logger.debug(`creating default category ${category.name} if it does not exist`);
      const categoryExists = await this.categoryService.findByName(category.name);

      await this.categoryService.createCategory(category.name, category.icon);
      if (!categoryExists) {

      }
    }
  }
}
