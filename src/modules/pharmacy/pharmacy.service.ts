import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class FarmaciasService {
  private readonly url = 'https://enlineanoticias.com.ar/farmacias-de-turno/';
  private readonly PUBLIC_DIR = join(process.cwd(), 'public');
  private readonly CACHE_FILE = join(this.PUBLIC_DIR, 'farmacias.json');

  async obtenerFarmacias(): Promise<any> {
    try {
      const { data } = await axios.get(this.url);
      const $ = cheerio.load(data);

      const tablas = $('table');
      const farmaciasPorDia: any[] = [];
      const detalleFarmacias: any[] = [];
      const farmaciasDict: Record<string, any> = {};

      // Segunda tabla: detalles
      if (tablas.length >= 2) {
        const filas = $(tablas[1]).find('tr');
        filas.slice(1).each((_, fila) => {
          const columnas = $(fila).find('td');
          if (columnas.length >= 3) {
            const nombre = $(columnas[0]).text().trim();
            const direccion = $(columnas[1]).text().trim();
            const telefono = $(columnas[2]).text().trim();

            farmaciasDict[nombre.toLowerCase()] = {
              nombre,
              direccion,
              telefono,
            };

            detalleFarmacias.push({
              nombre,
              direccion,
              telefono,
            });
          }
        });
      }

      // Primera tabla: farmacias por día
      if (tablas.length >= 1) {
        const filas = $(tablas[0]).find('tr');
        filas.each((_, fila) => {
          const columnas = $(fila).find('td');
          if (columnas.length >= 2) {
            const diaSemana = $(columnas[0]).text().trim();
            if (!diaSemana) return;

            const diaMes = $(columnas[1]).text().trim();
            const farmacias: any[] = [];

            columnas.slice(2).each((_, col) => {
              const nombreFarmacia = $(col).text().trim();
              if (nombreFarmacia) {
                // Intentar emparejar por nombre sin "farmacia" y en minúsculas
                const nombreNormalizado = nombreFarmacia.toLowerCase().replace(/^farmacia\s+/i, '');
                const detalle = Object.values(farmaciasDict).find((f) =>
                  f.nombre.toLowerCase().includes(nombreNormalizado),
                ) || { nombre: nombreFarmacia };

                // Si el nombre original en tabla no incluye “farmacia”, limpiar prefijo
                detalle.nombre = detalle.nombre.replace(/^FARMACIA\s+/i, '').trim();

                farmacias.push({ nombre: detalle.nombre });
              }
            });

            farmaciasPorDia.push({
              dia_semana: diaSemana.toUpperCase(),
              dia_mes: diaMes,
              farmacias,
            });
          }
        });
      }

      return {
        farmacias_por_dia: farmaciasPorDia,
        detalle_farmacias: detalleFarmacias,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Error al obtener farmacias');
    }
  }

  // Lee desde cache; si no existe o falla, obtiene en vivo y actualiza cache
  async obtenerFarmaciasDesdeCache(): Promise<any> {
    try {
      const raw = await fs.readFile(this.CACHE_FILE, 'utf8');
      return JSON.parse(raw);
    } catch {
      const data = await this.obtenerFarmacias();
      await this.escribirCache(data);
      return data;
    }
  }

  private async asegurarDirectorioPublic(): Promise<void> {
    await fs.mkdir(this.PUBLIC_DIR, { recursive: true });
  }

  private async escribirCache(data: any): Promise<void> {
    await this.asegurarDirectorioPublic();
    const tmpPath = this.CACHE_FILE + '.tmp';
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmpPath, this.CACHE_FILE);
  }

  // Ejecuta una vez cada 4 minutos a partir del primer día del mes a las 00:14 hs (hora de Argentina)
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON, {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async refrescarCacheMensual() {
    try {
      const data = await this.obtenerFarmacias();
      await this.escribirCache(data);
      return { message: 'Cache refrescado exitosamente' };
    } catch (err) {
      // No arrojar para no tumbar el scheduler; se registra el error
      console.error('Error al refrescar cache de farmacias:', err);
    }
  }
}
