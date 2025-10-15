import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class UploadService {
    async normalizeImage(filePath: string, options?: { width?: number; height?: number }): Promise<string> {

        try {
            const extname = path.extname(filePath);
            const dirname = path.dirname(filePath);
            const basename = path.basename(filePath, extname);

            const normalizedFilename = `${basename}.webp`;
            const normalizedPath = path.join(dirname, normalizedFilename);

            const sharpInstance = sharp(filePath);

            if (options?.width || options?.height) {
                sharpInstance.resize({
                    width: options?.width,
                    height: options?.height,
                    fit: 'cover',
                });
            }

            await sharpInstance.toFormat('webp', { quality: 80 }).toFile(normalizedPath);

            // Eliminar el archivo original
            await unlinkAsync(filePath);

            return normalizedFilename;
        } catch (error) {
            console.error('Error normalizing image:', error);
            throw new InternalServerErrorException('Error procesando la imagen');
        }
    }

    async deleteFileIfExists(filePath: string): Promise<void> {
        try {
            if (fs.existsSync(filePath)) {
                await unlinkAsync(filePath);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    resolveUploadPath(...segments: string[]): string {
        return path.join(process.cwd(), 'upload', ...segments);
    }
}
