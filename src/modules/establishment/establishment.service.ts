import { Establishment } from '@models/Establishment.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstablishmentsPaginationQueryParamsDto } from './dto/establishments-pagination-params.dto';

@Injectable()
export class EstablishmentService {
  constructor(
    @InjectRepository(Establishment)
    private readonly establishmentRepository: Repository<Establishment>,
  ) {}

  async getEstablishments(params: EstablishmentsPaginationQueryParamsDto) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;

    const establishmentsQueryBuilder = this.establishmentRepository.createQueryBuilder('establishments');
  }
}
