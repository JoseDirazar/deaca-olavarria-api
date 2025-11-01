import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';

@Injectable()
export class FarmaciasService {
  private readonly url = 'https://enlineanoticias.com.ar/farmacias-de-turno/';

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
}
