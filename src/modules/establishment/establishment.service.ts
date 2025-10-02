import { Establishment } from '@models/Establishment.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';
import { EstablishmentDto } from './dto/establishment.dto';
import { Image } from '@models/Image.entity';
import { User } from '@models/User.entity';
import { EstablishmentMapper } from './mapper/establishment-mapper';
import path, { join } from 'path';
import * as fs from 'fs/promises';

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

  async refreshCompleteness(establishmentId: string): Promise<boolean> {
    const establishment = await this.establishmentRepository.findOne({
      where: { id: establishmentId },
      relations: ['categories', 'subcategories', 'images'],
    });
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    establishment.isComplete = this.computeIsComplete(establishment);
    await this.establishmentRepository.save(establishment);
    return establishment.isComplete
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
      limit,
      total,
      establishments,
      page
    }
  }

  async getEstablishmentById(id: string) {
    return this.establishmentRepository.findOne({
      where: { id },
      relations: [
        'categories',
        'subcategories',
        'reviewsReceived',
        'images',
        'user'
      ]
    });
  }

  async createEstablishment(establishmentDto: EstablishmentDto, user: User) {
    const establishment = this.establishmentRepository.create({ ...establishmentDto, user });
    return await this.establishmentRepository.save(establishment);
  }

  async updateEstablishment(establishment: Establishment, establishmentDto: EstablishmentDto) {
    const updatedEstablishment = EstablishmentMapper.dtoToEstablishment(establishmentDto, establishment);
    return await this.establishmentRepository.save(updatedEstablishment);
  }

  async deleteEstablishment(establishment: Establishment) {
    // Eliminar archivos físicos de las imágenes
    if (establishment.images && establishment.images.length > 0) {
      for (const image of establishment.images) {
        try {
          const imagePath = join('./upload/user/establishment/', image.fileName);
          await fs.unlink(imagePath);
        } catch (error) {
          console.error(`Error al eliminar imagen ${image.fileName}:`, error);
        }
      }
      // Eliminar registros de imágenes de la BD
      await this.imageRepository.remove(establishment.images);
    }
    
    // Eliminar archivo físico del avatar
    if (establishment.avatar) {
      try {
        const avatarPath = join('./upload/user/establishment/', establishment.avatar);
        await fs.unlink(avatarPath);
      } catch (error) {
        console.error(`Error al eliminar avatar ${establishment.avatar}:`, error);
      }
    }
    
    // Ahora eliminar el establecimiento
    return await this.establishmentRepository.remove(establishment);
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

  async uploadImages(establishment: Establishment, fileNames: string[]) {
    // Crear las entidades Image correctamente
    const images = fileNames.map((fileName) => {
      const image = this.imageRepository.create({
        fileName,
        establishment,
      });
      return image;
    });

    // Guardar las imágenes primero
    const savedImages = await this.imageRepository.save(images);

    // Recargar el establishment con las imágenes actualizadas
    return await this.establishmentRepository.findOne({
      where: { id: establishment.id },
      relations: ['categories', 'subcategories', 'images'],
    });
  }

  async updateAvatar(establishment: Establishment, newAvatarFilePath: string) {
    await this.removeOldFileIfExist(newAvatarFilePath);
    establishment.avatar = newAvatarFilePath;
    return await this.establishmentRepository.save(establishment);
  }



  async removeOldFileIfExist(oldAvatarPath: string): Promise<boolean> {
    try {
      const path = join(
        process.cwd(),
        'upload',
        'establishment',
        oldAvatarPath,
      );
      await fs.unlink(path);
      return true;
    } catch (error) {
      // Log error pero continuar con la actualización
      console.error('Error eliminando avatar anterior:', error);
      return false;
    }

  }
}

