import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { v4 } from 'uuid';

export const UploadInterceptor = (path: string, allowed: string[]) =>
  FileInterceptor('file', {
    fileFilter: (_, file, cb) => {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      cb(
        allowed.includes(ext ?? '') ? null : new UnsupportedMediaTypeException(),
        allowed.includes(ext ?? ''),
      );
    },
    storage: diskStorage({
      destination: path,
      filename: (_, f, cb) => cb(null, `${v4()}.${f.originalname.split('.').pop()}`),
    }),
  });

export const UploadFilesInterceptor = (path: string, allowed: string[]) =>
  FilesInterceptor('files', 10, {
    fileFilter(_, file, callback) {
      if (!allowed.includes(file.originalname.split('.').pop() ?? '')) {
        return callback(new UnsupportedMediaTypeException(), false);
      }
      callback(null, true);
    },
    storage: diskStorage({
      destination: path,
      filename: (_, file, callback) => {
        const uniqueSuffix = v4();
        const extension = file.originalname.split('.').pop();
        const uniqueFilename = `${uniqueSuffix}.${extension}`;
        callback(null, uniqueFilename);
      },
    }),
  });
