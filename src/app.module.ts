import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { join } from 'path';
import { AppService } from './app.service';
import { DataService } from './scripts/DataService';
import { ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModuleOptions } from './config/options';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';


const   serveStaticOptions = {
  extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
};

@Module({
  imports: [
    ConfigModule.forRoot(ConfigModuleOptions),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads','users', 'avatars'),
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
        synchronize: true,
        force: true,
        namingStrategy: new SnakeNamingStrategy(),
      }),
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, DataService],
})
export class AppModule {}
