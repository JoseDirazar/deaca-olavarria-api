import { Establishment } from '@models/Establishment.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';
import { EstablishmentDto } from './dto/establishment.dto';
import { Image } from '@models/Image.entity';
import { UserService } from '@modules/iam/user/user.service';
import { User } from '@models/User.entity';

@Injectable()
export class EstablishmentService {
  constructor(
    @InjectRepository(Establishment)
    private readonly establishmentRepository: Repository<Establishment>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) { }

  async getPaginatedEstablishments(params: EstablishmentsPaginationQueryParamsDto) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const subcategories = params['subcategories[]'];
    const categories = params['categories[]'];
    const name = params.name;

    const establishmentsQueryBuilder = this.establishmentRepository.createQueryBuilder('establishments').leftJoinAndSelect('establishments.categories', 'categories').leftJoinAndSelect('establishments.subcategories', 'subcategories');

    if (subcategories) {
      establishmentsQueryBuilder.andWhere('subcategories.id IN (:...subcategories)', { subcategories });
    }
    if (categories) {
      establishmentsQueryBuilder.andWhere('categories.id IN (:...categories)', { categories });
    }
    if (name) {
      establishmentsQueryBuilder.andWhere('establishments.name ILIKE :name', { name: `%${name}%` });
    }
    const [establishments, total] = await establishmentsQueryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();


    return {
      data: establishments,
      meta: {
        currentPage: page,
        itemCount: establishments.length,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEstablishmentById(id: string) {
    const establishment = await this.establishmentRepository.findOne({
      where: { id }, relations: [
        'categories',
        'subcategories',
        'reviewsReceived',
        'images',
      ]
    });
    if (!establishment) return null;

    return establishment;
  }

  async createEstablishment(establishmentDto: EstablishmentDto, user: User) {


    const establishment = this.establishmentRepository.create({ ...establishmentDto, user });
    return await this.establishmentRepository.save(establishment);
  }

  async uploadImages(establishmentId: string, image: Express.Multer.File) {
    try {
      if (!image) {
        throw new BadRequestException('No se proporciono una imagen');
      }

      const establishment = await this.establishmentRepository.findOne({ where: { id: establishmentId } });
      if (!establishment) {
        throw new NotFoundException('Establecimiento no encontrado');
      }

      const imageEntity = this.imageRepository.create({
        name: image.filename,
        establishment: establishment,
      });

      const savedImage = await this.imageRepository.save(imageEntity);

      if (!savedImage) {
        throw new BadRequestException('No se pudo guardar la imagen');
      }

      establishment.images = [...(establishment.images || []), savedImage];
      await this.establishmentRepository.save(establishment);

      return savedImage;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}
