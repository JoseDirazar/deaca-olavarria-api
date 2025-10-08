import { join } from 'path';
const serveStaticOptions = {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
};
export const serveStaticModuleOptions = (dirname: string) => [
    {
        rootPath: join(dirname, '..', '..', 'upload', 'user', 'avatar'),
        serveRoot: '/user/avatar',
        serveStaticOptions,
    },
    {
        rootPath: join(dirname, '..', '..', 'upload', 'user', 'establishment'),
        serveRoot: '/user/establishment',
        serveStaticOptions,
    },
    {
        rootPath: join(dirname, '..', '..', 'upload', 'assets'),
        serveRoot: '/assets',
        serveStaticOptions,
    }
]
