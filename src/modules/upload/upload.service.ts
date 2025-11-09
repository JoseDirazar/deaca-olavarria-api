import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class UploadService {
  async normalizeImage(
    filePath: string,
    options?: { width?: number; height?: number },
  ): Promise<string> {
    try {
      const extname = path.extname(filePath);
      const dirname = path.dirname(filePath);
      const basename = path.basename(filePath, extname);

      // Create a temporary file path for the output
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempOutputPath = path.join(tempDir, `${Date.now()}-${basename}.webp`);

      let sharpInstance = sharp(filePath);

      if (options?.width || options?.height) {
        sharpInstance = sharpInstance.resize({
          width: options?.width,
          height: options?.height,
          fit: 'cover',
        });
      }

      // Process and save to temp file
      await sharpInstance.toFormat('webp', { quality: 80 }).toFile(tempOutputPath);

      // Delete original file
      await unlinkAsync(filePath);

      // Move the processed file to the original directory
      const finalFilename = `${basename}.webp`;
      const finalPath = path.join(dirname, finalFilename);
      
      // Ensure the target directory exists
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
      }
      
      // Move the file
      fs.renameSync(tempOutputPath, finalPath);

      return finalFilename;
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
