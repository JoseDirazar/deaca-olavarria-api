import { Establishment } from '@models/Establishment.entity';

export class EstablishmentMapper {
  static dtoToEstablishment(
    dto: Partial<Establishment>,
    establishment: Establishment,
  ): Establishment {
    return {
      ...establishment,
      ...dto,
    };
  }
}
