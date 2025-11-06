import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '@models/Image.entity';
import { User } from '@models/User.entity';
import { Establishment } from '@models/Establishment.entity';
import { Category } from '@models/Category.entity';
import { defaultUsers } from 'src/infrastructure/utils/default-users';
import { defaultEstablishments } from 'src/infrastructure/utils/default-establishments';
import { defaultCategories } from 'src/infrastructure/utils/default-categories';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);
  constructor(
    @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Establishment)
    private readonly establishmentRepository: Repository<Establishment>,
  ) {}

  async loadDataByDefault(): Promise<void> {
    for (const category of defaultCategories) {
      this.logger.debug(`creating default category ${category.name} if it does not exist`);
      const categoryExists = await this.categoryRepository.findOneBy({ name: category.name });

      if (!categoryExists) {
        const newCategory = this.categoryRepository.create(category);
        await this.categoryRepository.save(newCategory);
      }
    }

    for (const user of defaultUsers) {
      this.logger.debug(`creating default user ${user.email} if it does not exist`);
      const userExists = await this.userRepository.findOneBy({ email: user.email });

      if (!userExists) {
        const newUser = this.userRepository.create({ email: user.email, password: user.password });
        await this.userRepository.save(newUser);
      }
    }

    for (const establishment of defaultEstablishments) {
      this.logger.debug(
        `creating default establishment ${establishment.name} if it does not exist`,
      );

      const establishmentExists = await this.establishmentRepository.findOneBy({
        name: establishment.name,
      });

      if (!establishmentExists) {
        // 🧩 buscar el usuario por email
        const user = await this.userRepository.findOneBy({
          email: establishment.user.email,
        });

        if (!user) {
          this.logger.warn(
            `User with email ${establishment.user.email} not found. Skipping ${establishment.name}.`,
          );
          continue; // evita intentar guardar si no existe el usuario
        }

        // 🧠 crear la entidad sin mutar el objeto original
        const newEstablishment = this.establishmentRepository.create({
          ...establishment,
          user, // 👈 referencia existente
        });

        await this.establishmentRepository.save(newEstablishment);
        this.logger.debug(`Created establishment ${establishment.name}`);
      }
    }
  }
}
