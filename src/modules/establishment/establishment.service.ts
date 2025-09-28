import { Establishment } from '@models/Establishment.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';
import { EstablishmentDto } from './dto/establishment.dto';
import { Image } from '@models/Image.entity';
import { User } from '@models/User.entity';

@Injectable()
export class EstablishmentService {
  constructor(
    @InjectRepository(Establishment)
    private readonly establishmentRepository: Repository<Establishment>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) { }

  private computeIsComplete(est: Establishment): boolean {
    const hasAvatar = Boolean(est.avatar && est.avatar.trim().length > 0);
    const imagesCount = Array.isArray(est.images) ? est.images.length : 0;
    const hasMinImages = imagesCount >= 5;
    const hasCategory = Array.isArray(est.categories) && est.categories.length >= 1;
    const hasSubcategory = Array.isArray(est.subcategories) && est.subcategories.length >= 1;
    return hasAvatar && hasMinImages && hasCategory && hasSubcategory;
  }

  private async refreshCompleteness(establishmentId: string): Promise<Establishment> {
    const establishment = await this.establishmentRepository.findOne({
      where: { id: establishmentId },
      relations: ['categories', 'subcategories', 'images'],
    });
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    establishment.isComplete = this.computeIsComplete(establishment);
    return await this.establishmentRepository.save(establishment);
  }

  async getPaginatedEstablishments(params: EstablishmentsPaginationQueryParamsDto) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const subcategories = params['subcategories[]'];
    const categories = params['categories[]'];
    const name = params.name;
    const address = params.address;
    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = (params.sortOrder ?? 'DESC').toUpperCase() as 'ASC' | 'DESC';

    const establishmentsQueryBuilder = this.establishmentRepository
      .createQueryBuilder('establishments')
      .leftJoinAndSelect('establishments.categories', 'categories')
      .leftJoinAndSelect('establishments.subcategories', 'subcategories');

    // Usar EXISTS en lugar de JOIN directo para filtros
    if (subcategories) {
      establishmentsQueryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM establishments_subcategories_subcategories ess ' +
        'JOIN subcategories s ON ess.subcategoriesId = s.id ' +
        'WHERE ess.establishmentsId = establishments.id AND s.name IN (:...subcategories))',
        { subcategories }
      );
    }

    if (categories) {
      establishmentsQueryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM establishments_categories_categories ecc ' +
        'JOIN categories c ON ecc.categoriesId = c.id ' +
        'WHERE ecc.establishmentsId = establishments.id AND c.name IN (:...categories))',
        { categories }
      );
    }

    if (name) {
      establishmentsQueryBuilder.andWhere('establishments.name ILIKE :name', { name: `%${name}%` });
    }
    if (address) {
      establishmentsQueryBuilder.andWhere('establishments.address ILIKE :address', { address: `%${address}%` });
    }

    // Sorting whitelist to avoid SQL injection
    const sortWhitelist: Record<string, string> = {
      name: 'establishments.name',
      address: 'establishments.address',
      createdAt: 'establishments.createdAt',
    };
    const sortColumn = sortWhitelist[sortBy] ?? sortWhitelist['createdAt'];
    establishmentsQueryBuilder.orderBy(sortColumn, sortOrder);

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
    const created = await this.establishmentRepository.save(establishment);
    // Refresh completeness after create (loads relations properly)
    return await this.refreshCompleteness(created.id);
  }

  async updateEstablishment(id: string, establishmentDto: Partial<EstablishmentDto>) {
    const establishment = await this.establishmentRepository.findOne({ where: { id } });
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    Object.assign(establishment, establishmentDto);
    await this.establishmentRepository.save(establishment);
    return await this.refreshCompleteness(id);
  }

  async deleteEstablishment(id: string) {
    const establishment = await this.establishmentRepository.findOne({ where: { id } });
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    await this.establishmentRepository.remove(establishment);
    return { ok: true };
  }

  async setVerified(id: string, verified: boolean) {
    const establishment = await this.establishmentRepository.findOne({ where: { id } });
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    establishment.verified = Boolean(verified);
    return await this.establishmentRepository.save(establishment);
  }

  async getEstablishmentsByUser(userId: string) {
    return await this.establishmentRepository.find({
      where: { user: { id: userId } as any },
      relations: ['categories', 'subcategories', 'images'],
      order: { createdAt: 'DESC' },
    });
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
      // Update completeness considering new image
      await this.refreshCompleteness(establishmentId);
      return savedImage;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}

