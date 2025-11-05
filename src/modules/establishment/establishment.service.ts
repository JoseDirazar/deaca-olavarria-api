import { Establishment, EstablishmentStatus } from '@models/Establishment.entity';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';
import { EstablishmentDto } from './dto/establishment.dto';
import { Image } from '@models/Image.entity';
import { User } from '@models/User.entity';
import { EstablishmentMapper } from './mapper/establishment-mapper';
import { join } from 'path';
import * as fs from 'fs/promises';
import { Review } from '@models/Review.entity';
import { ReviewDto } from './dto/review.dto';
import { UploadService } from '@modules/upload/upload.service';

@Injectable()
export class EstablishmentService {
  constructor(
    @InjectRepository(Establishment)
    private readonly establishmentRepository: Repository<Establishment>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly uploadService: UploadService,
  ) {}

  async getPaginatedEstablishments(params: EstablishmentsPaginationQueryParamsDto) {
    const search = params['search'];
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = (params.sortOrder ?? 'DESC').toUpperCase() as 'ASC' | 'DESC';

    // Normalizar categories: convertir string a array si es necesario
    const acceptCreditCard = params.acceptCreditCard;
    const acceptDebitCard = params.acceptDebitCard;
    const acceptMercadoPago = params.acceptMercadoPago;
    const acceptCtaDNI = params.acceptCtaDNI;
    const hasDiscount = params.hasDiscount;
    const categories = params['categories[]'];
    const subcategories = params['subcategories[]'];
    const normalizedCategories = categories
      ? Array.isArray(categories)
        ? categories
        : [categories]
      : null;
    const normalizedSubcategories = subcategories
      ? Array.isArray(subcategories)
        ? subcategories
        : [subcategories]
      : null;

    const establishmentsQueryBuilder = this.establishmentRepository
      .createQueryBuilder('establishments')
      .select([
        'establishments.id',
        'establishments.name',
        'establishments.address',
        'establishments.description',
        'establishments.avatar',
        'establishments.status',
        'establishments.createdAt',
        'establishments.updatedAt',
        'establishments.latitude',
        'establishments.longitude',
        'establishments.slug',
        'establishments.email',
      ])
      .leftJoinAndSelect('establishments.categories', 'categories')
      .leftJoinAndSelect('establishments.subcategories', 'subcategories');

    // Filtrar por categorías si existen
    if (normalizedCategories && normalizedCategories.length > 0) {
      establishmentsQueryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM establishment_categories_category ecc ' +
          'JOIN category c ON ecc.category_id = c.id ' +
          'WHERE ecc.establishment_id = establishments.id AND c.name IN (:...categories))',
        { categories: normalizedCategories },
      );
    }

    // Filtrar por subcategorias si existen
    if (normalizedSubcategories && normalizedSubcategories.length > 0) {
      establishmentsQueryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM establishment_categories_subcategory ecs ' +
          'JOIN subcategory s ON ecs.subcategory_id = s.id ' +
          'WHERE ecs.establishment_id = establishments.id AND s.name IN (:...subcategories))',
        { subcategories: normalizedSubcategories },
      );
    }

    // Filtrar por búsqueda si existe
    if (search && search.trim().length > 0) {
      establishmentsQueryBuilder.andWhere(
        'establishments.name ILIKE :search OR establishments.name ILIKE :search',
        { search: `%${search.trim()}%` },
      );
    }

    if (acceptCreditCard) {
      establishmentsQueryBuilder.andWhere('establishments.acceptCreditCard = :acceptCreditCard', {
        acceptCreditCard,
      });
    }

    if (acceptDebitCard) {
      establishmentsQueryBuilder.andWhere('establishments.acceptDebitCard = :acceptDebitCard', {
        acceptDebitCard,
      });
    }

    if (acceptMercadoPago) {
      establishmentsQueryBuilder.andWhere('establishments.acceptMercadoPago = :acceptMercadoPago', {
        acceptMercadoPago,
      });
    }

    if (acceptCtaDNI) {
      establishmentsQueryBuilder.andWhere('establishments.acceptCtaDNI = :acceptCtaDNI', {
        acceptCtaDNI,
      });
    }

    if (hasDiscount) {
      establishmentsQueryBuilder.andWhere('establishments.hasDiscount = :hasDiscount', {
        hasDiscount,
      });
    }

    // Ordenamiento
    const sortWhitelist: Record<string, string> = {
      name: 'establishments.name',
      address: 'establishments.address',
      createdAt: 'establishments.createdAt',
    };
    const sortColumn = sortWhitelist[sortBy] ?? sortWhitelist['createdAt'];
    establishmentsQueryBuilder.orderBy(sortColumn, sortOrder);

    // Paginación
    const [establishments, total] = await establishmentsQueryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      limit,
      total,
      establishments,
      page,
    };
  }

  async getAdminEstablishmentsChart() {
    const totalEstablishments = await this.establishmentRepository
      .createQueryBuilder('establishment')
      .select('establishment.createdAt', 'createdAt')
      .getRawMany();
    return totalEstablishments;
  }

  async getEstablishmentBySlug(slug: string) {
    return this.establishmentRepository.findOne({
      where: { slug },
      relations: ['categories', 'subcategories', 'images', 'user'],
    });
  }

  async getEstablishmentByName(name: string) {
    return this.establishmentRepository.findOne({ where: { name: ILike(`%${name}%`) } });
  }

  async getEstablishmentById(id: string) {
    return this.establishmentRepository.findOne({
      where: { id },
      relations: ['categories', 'subcategories', 'images', 'user'],
    });
  }

  async createEstablishment(establishmentDto: EstablishmentDto, user: User) {
    const establishment = this.establishmentRepository.create({ ...establishmentDto, user });
    return await this.establishmentRepository.save(establishment);
  }

  async updateEstablishment(establishment: Establishment, establishmentDto: EstablishmentDto) {
    const updatedEstablishment = EstablishmentMapper.dtoToEstablishment(
      establishmentDto,
      establishment,
    );
    return await this.establishmentRepository.save(updatedEstablishment);
  }

  async deleteEstablishment(establishment: Establishment) {
    if (establishment.images && establishment.images.length > 0) {
      for (const image of establishment.images) {
        try {
          const imagePath = join('./upload/user/establishment/', image.fileName);
          await fs.unlink(imagePath);
        } catch (error) {
          console.error(`Error al eliminar imagen ${image.fileName}:`, error);
        }
      }
      await this.imageRepository.remove(establishment.images);
    }

    if (establishment.avatar) {
      try {
        const avatarPath = join('./upload/user/establishment/', establishment.avatar);
        await fs.unlink(avatarPath);
      } catch (error) {
        console.error(`Error al eliminar avatar ${establishment.avatar}:`, error);
      }
    }

    return await this.establishmentRepository.remove(establishment);
  }

  async changeStatus(id: string, status: EstablishmentStatus) {
    const establishment = await this.establishmentRepository.findOne({ where: { id } });
    if (!establishment) throw new NotFoundException('Establecimiento no encontrado');
    establishment.status = status;
    return await this.establishmentRepository.save(establishment);
  }

  async getEstablishmentsByUser(userId: string) {
    return await this.establishmentRepository.find({
      where: { user: { id: userId } as any },
      relations: ['categories', 'subcategories', 'images', 'visits'],
      order: { createdAt: 'DESC' },
    });
  }

  async uploadImages(establishment: Establishment, fileNames: string[]) {
    const images = fileNames.map((fileName) => {
      const image = this.imageRepository.create({
        fileName,
        establishment,
      });
      return image;
    });

    await this.imageRepository.save(images);
    return await this.establishmentRepository.findOne({
      where: { id: establishment.id },
      relations: ['categories', 'subcategories', 'images'],
    });
  }

  async updateAvatar(establishment: Establishment, newAvatarFileName: string) {
    if (establishment.avatar) {
      const oldAvatarPath = this.uploadService.resolveUploadPath(
        'establishment',
        'logo',
        establishment.avatar,
      );
      await this.uploadService.deleteFileIfExists(oldAvatarPath);
    }
    const normalizedPath = await this.uploadService.normalizeImage(newAvatarFileName);
    establishment.avatar = normalizedPath;
    return await this.establishmentRepository.save(establishment);
  }

  async getReviewsByEstablishmentId(id: string) {
    return await this.reviewRepository.find({
      where: { establishment: { id } },
      relations: ['reviewer'],
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
        establishment: {
          id: true,
        },
      },
    });
  }

  async createReview(user: User, establishment: Establishment, reviewDto: ReviewDto) {
    const review = this.reviewRepository.create({
      ...reviewDto,
      establishment,
      reviewer: user,
    });
    const reviewCreated = await this.reviewRepository.save(review);
    const loadedReview = await this.getReviewById(reviewCreated.id);
    await this.updateEstablishmentRating(establishment);
    return loadedReview;
  }

  async updateReview(review: Review, reviewDto: ReviewDto, establishment: Establishment) {
    review.rating = reviewDto.rating;
    review.comment = reviewDto.comment;
    const reviewUpdated = await this.reviewRepository.save(review);
    const loadedReview = await this.getReviewById(reviewUpdated.id);
    await this.updateEstablishmentRating(establishment);
    return loadedReview;
  }

  async deleteReview(review: Review, establishment: Establishment) {
    const reviewDeleted = await this.reviewRepository.remove(review);
    const loadedReview = await this.getReviewById(reviewDeleted.id);
    await this.updateEstablishmentRating(establishment);
    return loadedReview;
  }

  async getReviewById(id: string) {
    return await this.reviewRepository.findOne({
      where: { id },
      relations: ['reviewer', 'establishment'],
    });
  }

  private async updateEstablishmentRating(establishment: Establishment) {
    const reviews = await this.reviewRepository.find({
      where: { establishment: { id: establishment.id } },
    });
    const totalRatings = reviews.reduce((acc, review) => acc + review.rating, 0);
    establishment.rating = reviews.length === 0 ? 0 : totalRatings / reviews.length;
    await this.establishmentRepository.save(establishment);
    return establishment;
  }

  async deleteImage(establishment: Establishment, imageId: string) {
    const image = await this.imageRepository.findOne({
      where: { id: imageId },
      relations: ['establishment'],
    });
    if (!image) throw new NotFoundException('Imagen no encontrada');
    if (image.establishment.id !== establishment.id)
      throw new UnauthorizedException('No tienes permiso para eliminar esta imagen');
    const imagePath = this.uploadService.resolveUploadPath('establishment', image.fileName);
    await this.uploadService.deleteFileIfExists(imagePath);
    return await this.imageRepository.remove(image);
  }
}
