import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tendency } from '@modules/tendency/entity/Tendency.entity';

@Injectable()
export class TendencyService {
  constructor(
    @InjectRepository(Tendency)
    private readonly tendencyRepository: Repository<Tendency>,
  ) {}

  async list() {
    return await this.tendencyRepository.find({
      relations: { establishment: true },
      order: { position: 'ASC' },
    });
  }

  async createOrUpdate({
    establishmentId,
    position,
  }: {
    establishmentId: string;
    position: number;
  }) {
    if (position < 1) throw new BadRequestException('La posición debe ser mayor/igual a 1');
    const existingTendency = await this.tendencyRepository.findOne({
      where: {
        establishmentId,
      },
      relations: ['establishment'],
    });

    if (existingTendency)
      throw new BadRequestException({
        message: `${existingTendency.establishment?.name} ya se encuentra en la lista en la posición ${existingTendency.position}`,
      });
    const existingAtPosition = await this.tendencyRepository.findOne({
      where: { position },
      relations: ['establishment'],
    });

    if (existingAtPosition)
      throw new BadRequestException({
        message: `La posición ${existingAtPosition.position} seleccionada ya se encuentra ocupada por ${existingAtPosition?.establishment?.name}`,
      });

    const created = this.tendencyRepository.create({ establishmentId, position });
    return await this.tendencyRepository.save(created);
  }

  async reorder(items: { id: string; position: number }[]) {
    if (!items?.length) return [];

    // Normalizar datos
    const updates = items.map((i) => ({
      id: i.id,
      position: Number(i.position),
    }));

    // Verificar que no vengan posiciones duplicadas en el payload
    const uniquePositions = new Set(updates.map((i) => i.position));
    if (uniquePositions.size !== updates.length) {
      throw new BadRequestException('Posiciones duplicadas en la solicitud');
    }

    // Obtener los registros a modificar
    const ids = updates.map((i) => i.id);
    const found = await this.tendencyRepository.find({
      where: { id: In(ids) },
      relations: ['establishment'],
    });

    if (found.length !== ids.length) {
      throw new NotFoundException('Algunas tendencias no existen');
    }

    // Obtener todas las posiciones existentes en BD (solo columnas necesarias)
    const existing = await this.tendencyRepository
      .createQueryBuilder('t')
      .select(['t.id', 't.position'])
      .leftJoinAndSelect('t.establishment', 'establshment')
      .getMany();

    // Verificar conflictos entre nuevas posiciones y las actuales de otros registros
    for (const { id, position } of updates) {
      const conflict = existing.find((t) => t.position === position && t.id !== id);
      if (conflict) {
        throw new BadRequestException(
          `La posición ${position} que intentas guardar para ${found.find((f) => id === f.id)?.establishment?.name} ya está asignada a ${conflict.establishment?.name}`,
        );
      }
    }

    // Preparar para guardar
    const toSave = found.map((t) => ({
      ...t,
      position: updates.find((i) => i.id === t.id)!.position,
    }));

    return await this.tendencyRepository.save(toSave);
  }

  async remove(id: string) {
    const existing = await this.tendencyRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Tendencia no encontrada');
    await this.tendencyRepository.remove(existing);
    return { id };
  }
}
