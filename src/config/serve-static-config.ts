import { join } from 'path';
const serveStaticOptions = {
  extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
};
export const serveStaticModuleOptions = (dirname: string) => [
  {
    rootPath: join(dirname, '..', '..', 'upload', 'user'),
    serveRoot: '/user',
    serveStaticOptions,
  },
  {
    rootPath: join(dirname, '..', '..', 'upload', 'establishment'),
    serveRoot: '/establishment',
    serveStaticOptions,
  },
  {
    rootPath: join(dirname, '..', '..', 'upload', 'establishment', 'logo'),
    serveRoot: '/establishment/logo',
    serveStaticOptions,
  },
  {
    rootPath: join(dirname, '..', '..', 'upload', 'assets'),
    serveRoot: '/assets',
    serveStaticOptions,
  },
  {
    rootPath: join(dirname, '..', '..', 'upload', 'category'),
    serveRoot: '/category',
    serveStaticOptions,
  },
];
