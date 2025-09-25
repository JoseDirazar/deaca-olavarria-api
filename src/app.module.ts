import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { join } from 'path';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModuleOptions } from './config/options';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { IamModule } from '@modules/iam/iam.module';
import { CategoryModule } from './modules/category/category.module';
import { EstablishmentModule } from './modules/establishment/establishment.module';
import { JwtGlobalModule } from './shared/jwt/jwt.module';
import { DataService } from './infrastructure/scripts/DataService';

const serveStaticOptions = {
  extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
};

@Module({
  imports: [
    ConfigModule.forRoot(ConfigModuleOptions),
    JwtGlobalModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads', 'users', 'avatars'),
      serveRoot: '/users/avatar',
      serveStaticOptions,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads', 'users', 'establishments'),
      serveRoot: '/users/establishments',
      serveStaticOptions,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads', 'assets'),
      serveRoot: '/assets',
      serveStaticOptions,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number | undefined>('database.port'),
        username: configService.get<string>('database.user'),
        password: configService.get<string>('database.pass'),
        database: configService.get<string>('database.name'),
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        force: configService.get<string>('NODE_ENV') !== 'production',
        namingStrategy: new SnakeNamingStrategy(),
      }),
    }),
    IamModule,
    CategoryModule,
    EstablishmentModule,
  ],
  controllers: [AppController],
  providers: [AppService, DataService],
})
export class AppModule { }
