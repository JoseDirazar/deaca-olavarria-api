import * as cheerio from 'cheerio';
import { FarmaciaDetalle } from './detalle.scraper';

export interface FarmaciaPorDia {
  dia_semana: string;
  dia_mes: string;
  farmacias: { nombre: string }[];
}

export function obtenerFarmaciasPorDia(
  html: string,
  detalleFarmacias: FarmaciaDetalle[],
): FarmaciaPorDia[] {
  const $ = cheerio.load(html);
  const tablas = $('table');

  const farmaciasPorDia: FarmaciaPorDia[] = [];

  if (tablas.length >= 1) {
    const filas = $(tablas[0]).find('tr');
    // @ts-ignore
    filas.each((_, fila) => {
      const columnas = $(fila).find('td');
      if (columnas.length >= 2) {
        const diaSemana = $(columnas[0]).text().trim();
        if (!diaSemana) return;

        const diaMes = $(columnas[1]).text().trim();
        const farmacias: any[] = [];

        // @ts-ignore
        columnas.slice(2).each((_, col) => {
          const nombreFarmacia = $(col).text().trim();
          if (nombreFarmacia) {
            const nombreNormalizado = nombreFarmacia.toLowerCase().replace(/^farmacia\s+/i, '');
            const detalle =
              detalleFarmacias.find((f) => f.nombre.toLowerCase().includes(nombreNormalizado)) ||
              ({ nombre: nombreFarmacia } as any);

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

  return farmaciasPorDia;
}
