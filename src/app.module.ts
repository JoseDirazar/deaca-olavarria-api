import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModuleOptions } from './config/options';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamModule } from '@modules/iam/iam.module';
import { CategoryModule } from './modules/category/category.module';
import { EstablishmentModule } from './modules/establishment/establishment.module';
import { JwtGlobalModule } from './shared/jwt/jwt.module';
import { serveStaticModuleOptions } from './config/serve-static-config';
import { UploadModule } from '@modules/upload/upload.module';
import { EmailModule } from '@modules/email/email.module';
import { EventModule } from '@modules/event/event.module';
import { typeormConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot(ConfigModuleOptions),
    JwtGlobalModule,
    ServeStaticModule.forRoot(
      ...serveStaticModuleOptions(__dirname)
    ),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeormConfig,
    }),
    IamModule,
    CategoryModule,
    EstablishmentModule,
    EventModule,
    UploadModule,
    EmailModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
