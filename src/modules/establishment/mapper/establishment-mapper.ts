import { Establishment } from '@models/Establishment.entity';
import { EstablishmentDto } from '../dto/establishment.dto';

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
