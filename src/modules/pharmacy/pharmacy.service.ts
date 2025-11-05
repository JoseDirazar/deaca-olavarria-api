import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { promises as fs } from 'fs';
import { join } from 'path';
import { obtenerFarmaciasPorDia } from '@modules/pharmacy/scripts/calendario.scrapper';
import { obtenerDetalleFarmacias } from '@modules/pharmacy/scripts/detalle.scraper';

@Injectable()
export class FarmaciasService {
  private readonly url = 'https://enlineanoticias.com.ar/farmacias-de-turno/';
  private readonly PUBLIC_DIR = join(process.cwd(), 'public');
  private readonly FILE_DETALLE = join(this.PUBLIC_DIR, 'detalle_farmacias.json');
  private readonly FILE_CALENDARIO = join(this.PUBLIC_DIR, 'farmacias_por_dia.json');

  async obtenerFarmaciasDesdeCache() {
    try {
      const detalle = await this.leerJSON(this.FILE_DETALLE);
      const calendario = await this.leerJSON(this.FILE_CALENDARIO);
      return { detalle_farmacias: detalle, farmacias_por_dia: calendario };
    } catch (err) {
      throw new InternalServerErrorException('Error al leer cache de farmacias');
    }
  }

  async refrescarDatos(): Promise<any> {
    try {
      const { data } = await axios.get(this.url);
      const detalle = await obtenerDetalleFarmacias(data);
      await this.guardarJSON(this.FILE_DETALLE, detalle);

      const calendario = obtenerFarmaciasPorDia(data, detalle);
      await this.guardarJSON(this.FILE_CALENDARIO, calendario);

      return { message: 'Datos de farmacias actualizados correctamente' };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Error al refrescar datos de farmacias');
    }
  }

  private async leerJSON(path: string) {
    const data = await fs.readFile(path, 'utf8');
    return JSON.parse(data);
  }

  private async guardarJSON(path: string, data: any) {
    await fs.mkdir(this.PUBLIC_DIR, { recursive: true });
    const tmp = path + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, path);
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async refrescarMensual() {
    try {
      await this.refrescarDatos();
      console.log('✅ Cache de farmacias actualizado automáticamente');
    } catch (err) {
      console.error('❌ Error al refrescar cache automáticamente:', err);
    }
  }
}
