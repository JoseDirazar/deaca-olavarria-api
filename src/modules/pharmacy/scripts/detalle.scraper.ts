import * as cheerio from 'cheerio';
import axios, { AxiosError } from 'axios';

export interface FarmaciaDetalle {
  nombre: string;
  direccion: string;
  telefono: string;
  lat: number | null;
  lng: number | null;
}

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.GEODECODING_API_KEY;
    if (!apiKey) throw new Error('Falta la variable GEODECODING_API_KEY');

    const fullAddress = `${address}, Olavarría, Buenos Aires, Argentina`;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      fullAddress,
    )}&key=${apiKey}`;

    const { data } = await axios.get(url, {
      timeout: 10000, // 10 segundos de timeout
    });

    if (data.status !== 'OK' || !data.results.length) {
      console.warn(`Geocoding falló para "${fullAddress}" (status: ${data.status})`);
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Error al obtener geocodificación:', error.response?.data);
    } else {
      console.error('Error al obtener geocodificación:', error);
    }
    return null;
  }
}

export async function obtenerDetalleFarmacias(html: string): Promise<FarmaciaDetalle[]> {
  const $ = cheerio.load(html);
  const tablas = $('table');

  const detalleFarmacias: FarmaciaDetalle[] = [];

  if (tablas.length >= 2) {
    const filas = $(tablas[1]).find('tr');
    for (const fila of filas.slice(1)) {
      const columnas = $(fila).find('td');
      if (columnas.length >= 3) {
        const nombre = $(columnas[0]).text().trim();
        const direccion = $(columnas[1]).text().trim();
        const telefono = $(columnas[2]).text().trim();

        const coords = await geocodeAddress(direccion);
        await new Promise((res) => setTimeout(res, 1000)); // limitar 1 req/s

        detalleFarmacias.push({
          nombre,
          direccion,
          telefono,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        });
      }
    }
  }

  return detalleFarmacias;
}
